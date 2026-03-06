import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { mealPackagesApi, gameCoinsApi } from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateGameCoins } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVND } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  ArrowRight,
  Star,
  RefreshCw,
  CheckCircle2,
  Info,
  Coins,
  ArrowRightLeft,
} from "lucide-react";
import type { MealPackage } from "@/types";

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { socket } = useSocket();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "normal";

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["mealPackages", true],
    queryFn: () => mealPackagesApi.getPackages(true),
  });

  useEffect(() => {
    if (!socket) return;
    const handlePackageChange = () => {
      queryClient.invalidateQueries({ queryKey: ["mealPackages"] });
    };
    socket.on("package_created", handlePackageChange);
    socket.on("package_updated", handlePackageChange);
    socket.on("package_deleted", handlePackageChange);
    return () => {
      socket.off("package_created", handlePackageChange);
      socket.off("package_updated", handlePackageChange);
      socket.off("package_deleted", handlePackageChange);
    };
  }, [socket, queryClient]);

  const allPackages = data?.data.data || [];
  const normalPackages = allPackages.filter(
    (pkg) => pkg.packageType === "normal" || !pkg.packageType,
  );
  const noRicePackages = allPackages.filter(
    (pkg) => pkg.packageType === "no-rice",
  );
  const coinPackages = allPackages.filter(
    (pkg) => pkg.packageType === "coin-exchange",
  );

  const handleExchange = async (pkg: MealPackage) => {
    if (!isAuthenticated) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để đổi xu.",
        variant: "destructive",
      });
      return;
    }

    const coinNeeded = pkg.coinPrice || 0;
    if ((user?.gameCoins || 0) < coinNeeded) {
      toast({
        title: "Không đủ xu",
        description: `Bạn cần ${coinNeeded.toLocaleString()} xu để đổi gói này.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await gameCoinsApi.exchange(pkg._id);
      if (response.data.success && response.data.data) {
        toast({
          title: "Đổi thành công!",
          description: `Bạn đã đổi ${coinNeeded.toLocaleString()} xu lấy ${pkg.turns} lượt đặt cơm.`,
          variant: "success",
        });
        // Update user coins in store
        dispatch(updateGameCoins(response.data.data.gameCoins));
        queryClient.invalidateQueries({ queryKey: ["myPackages"] });
      }
    } catch (error: any) {
      toast({
        title: "Đổi thất bại",
        description: error.response?.data?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📦</div>
          <p className="text-gray-500">Đang tải gói...</p>
        </div>
      </div>
    );
  }

  const PackageGrid = ({
    packages,
    type,
  }: {
    packages: MealPackage[];
    type: "normal" | "no-rice" | "coin-exchange";
  }) => {
    const isCoin = type === "coin-exchange";
    const accentColor = isCoin
      ? "amber"
      : type === "normal"
        ? "orange"
        : "blue";
    const gradientFrom = isCoin
      ? "from-amber-400"
      : type === "normal"
        ? "from-orange-500"
        : "from-blue-500";
    const gradientTo = isCoin
      ? "to-orange-500"
      : type === "normal"
        ? "to-red-500"
        : "to-indigo-500";

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg, i) => {
          const isPopular = i === 1;
          return (
            <div
              key={pkg._id}
              className={`rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
                isPopular
                  ? `bg-gradient-to-br ${gradientFrom} ${gradientTo} p-[2px] shadow-xl shadow-${accentColor}-200`
                  : `border border-gray-200 hover:border-${accentColor}-300 hover:shadow-lg`
              }`}
            >
              <div
                className={`h-full rounded-2xl p-7 ${isPopular ? "bg-white" : ""}`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="flex justify-center mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white text-xs font-black rounded-full uppercase tracking-wider`}
                    >
                      <Star size={12} fill="white" />
                      Phổ biến nhất
                    </span>
                  </div>
                )}

                {/* Package name */}
                <h3 className="text-xl font-black text-center text-gray-900 mb-1">
                  {pkg.name}
                </h3>
                <p className="text-center text-gray-400 text-sm mb-5">
                  {pkg.turns} lượt đặt{" "}
                  {type === "no-rice" ? "(không cơm)" : "cơm"}
                </p>

                {/* Price */}
                <div className="text-center mb-5">
                  <p className={`text-4xl font-black text-${accentColor}-600`}>
                    {isCoin
                      ? `${(pkg.coinPrice || 0).toLocaleString()} Xu`
                      : formatVND(pkg.price)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {isCoin ? (
                      <>
                        tương đương{" "}
                        <span className="font-bold">
                          {pkg.turns.toLocaleString()}
                        </span>{" "}
                        lượt cơm
                      </>
                    ) : (
                      <>
                        chỉ{" "}
                        <span className={`font-bold text-${accentColor}-500`}>
                          ~{formatVND(Math.round(pkg.price / pkg.turns))}
                        </span>
                        /lượt
                      </>
                    )}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2.5 mb-6">
                  {[
                    `${pkg.turns} lượt đặt ${type === "no-rice" ? "món" : "cơm"}`,
                    `Hiệu lực ${pkg.validDays} ngày`,
                    "Đặt món linh hoạt",
                    "Đổi xu an toàn 100%",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2
                        size={15}
                        className={
                          isPopular
                            ? `text-${accentColor}-500`
                            : "text-emerald-500"
                        }
                      />
                      <span className="text-gray-600">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isCoin ? (
                  <Button
                    onClick={() => handleExchange(pkg)}
                    className={`w-full h-11 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200 gap-2 transition-all transform active:scale-95`}
                  >
                    <ArrowRightLeft size={16} />
                    Đổi ngay
                  </Button>
                ) : (
                  <Link to={`/packages/${pkg._id}`}>
                    <Button
                      className={`w-full h-11 rounded-xl font-bold text-sm ${
                        isPopular
                          ? `bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white shadow-md shadow-${accentColor}-200`
                          : `border-gray-200 hover:border-${accentColor}-400 hover:text-${accentColor}-600`
                      }`}
                      variant={isPopular ? "default" : "outline"}
                    >
                      {isPopular ? "🔥 Mua ngay" : "Chọn gói này"}
                      <ArrowRight size={15} className="ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="absolute right-0 top-1 h-9 w-9 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
        </Button>
        <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-2">
          Bảng giá
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">
          Chọn gói phù hợp với bạn
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Mua gói nhiều lượt sẽ tiết kiệm hơn. Gói nào cũng linh hoạt sử dụng!
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={(val) => setSearchParams({ tab: val })}
        className="mb-8"
      >
        <TabsList className="flex w-full max-w-2xl mx-auto h-14 rounded-xl bg-gray-100 p-1">
          <TabsTrigger
            value="normal"
            className="flex-1 gap-2 rounded-lg font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            🍚 Có cơm
            <span className="hidden sm:inline-flex text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-white">
              30k/phần
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="no-rice"
            className="flex-1 gap-2 rounded-lg font-bold data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            🥢 Không cơm
            <span className="hidden sm:inline-flex text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-white">
              20k/phần
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="coin-exchange"
            className="flex-1 gap-2 rounded-lg font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md"
          >
            🪙 Đổi xu
            <span className="hidden sm:inline-flex text-[10px] bg-amber-100 text-amber-900 px-2 py-1 rounded-full data-[state=active]:bg-white/20 data-[state=active]:text-white">
              HOT
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normal" className="mt-8">
          <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100 flex items-start gap-3">
            <Info size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-800">
              <strong>Gói có cơm:</strong> Mỗi lượt đặt = 1 suất cơm trắng kèm
              món ăn (30,000đ/phần)
            </p>
          </div>
          <PackageGrid packages={normalPackages} type="normal" />
        </TabsContent>

        <TabsContent value="no-rice" className="mt-8">
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              <strong>Gói không cơm:</strong> Mỗi lượt đặt = 1 phần món ăn,
              không lấy cơm (20,000đ/phần)
            </p>
          </div>
          <PackageGrid packages={noRicePackages} type="no-rice" />
        </TabsContent>

        <TabsContent value="coin-exchange" className="mt-8">
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3 flex-1">
              <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Đổi xu lấy lượt cơm:</strong> Sử dụng xu kiếm được từ
                trò chơi để đổi lấy lượt cơm miễn phí. (Tỷ lệ: 100,000 xu = 1
                lượt)
              </p>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-3 bg-white border border-amber-200 px-5 py-3 rounded-2xl shadow-sm shadow-amber-100">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Coins className="text-amber-600" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                    Số dư xu hiện tại
                  </p>
                  <p className="text-xl font-black text-amber-600 leading-none">
                    {(user?.gameCoins || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
          <PackageGrid packages={coinPackages} type="coin-exchange" />
        </TabsContent>
      </Tabs>

      {/* Info */}
      <Card className="bg-gray-50 border-none shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Info size={16} className="text-orange-500" />
            Lưu ý
          </h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={14}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <span>
                <strong>Gói có cơm:</strong> 30,000đ/lượt — đặt món kèm cơm
                trắng
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={14}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <span>
                <strong>Gói không cơm:</strong> 20,000đ/lượt — chỉ đặt món ăn
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={14}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <span>
                Gói hết hạn sau số ngày quy định kể từ khi được xác nhận
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={14}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <span>Sau khi mua, vui lòng chờ admin xác nhận thanh toán</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                size={14}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <span>Bạn có thể sở hữu nhiều gói cùng lúc (cả 2 loại)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
