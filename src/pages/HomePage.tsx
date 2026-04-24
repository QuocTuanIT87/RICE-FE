import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { mealPackagesApi, dailyMenusApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND } from "@/lib/utils";
import {
  UtensilsCrossed,
  Clock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Star,
  CheckCircle2,
  ChefHat,
  Timer,
  Wallet,
  Shield,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSocket } from "@/contexts/SocketContext";

export default function HomePage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data: packages } = useQuery({
    queryKey: ["mealPackages"],
    queryFn: () => mealPackagesApi.getPackages({ isActive: true, limit: 100 }),
  });

  const { data: todayMenu } = useQuery({
    queryKey: ["todayMenu"],
    queryFn: () => dailyMenusApi.getTodayMenu(),
  });

  useEffect(() => {
    if (!socket) return;
    const handleMenuUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["todayMenu"] });
    };
    socket.on("menu_created", handleMenuUpdate);
    socket.on("menu_locked", handleMenuUpdate);
    socket.on("menu_unlocked", handleMenuUpdate);
    socket.on("menu_updated", handleMenuUpdate);
    return () => {
      socket.off("menu_created", handleMenuUpdate);
      socket.off("menu_locked", handleMenuUpdate);
      socket.off("menu_unlocked", handleMenuUpdate);
      socket.off("menu_updated", handleMenuUpdate);
    };
  }, [socket, queryClient]);

  const activePackages = packages?.data.data?.docs || [];
  const menus = todayMenu?.data.data || [];
  const menu = menus.length > 0 ? menus[0] : null;

  const { config: systemConfig } = useAppSelector((state) => state.system);
  const bannerUrl = systemConfig?.websiteBanner || "https://www.shutterstock.com/image-photo/blurred-modern-restaurant-interior-warm-260nw-2687315663.jpg";

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen -mt-8 -mb-8 overflow-x-hidden">
      {/* ===================== HERO ===================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          minHeight: "100vh",
          backgroundImage:
            `url('${bannerUrl}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

        <div className="relative z-10 text-center px-6 py-20 w-full max-w-3xl mx-auto">
          <div className="inline-block mb-6 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
            <span className="text-orange-300 text-xs font-bold tracking-wide">
              🍚 Hệ thống đặt cơm trực tuyến
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-5">
            Bữa cơm ngon
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
              mỗi ngày
            </span>
          </h1>

          <p className="text-sm md:text-base text-gray-300 max-w-lg mx-auto mb-8 leading-relaxed">
            Đặt cơm văn phòng nhanh chóng, tiện lợi. Mua gói lượt tiết kiệm —
            theo dõi đơn hàng real-time, nhận thông báo tức thì.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
            {isAuthenticated ? (
              <Link to="/order">
                <Button className="h-12 px-7 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/25 gap-2">
                  <UtensilsCrossed size={18} />
                  Đặt cơm ngay
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button className="h-12 px-7 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/25 gap-2">
                    <Sparkles size={18} />
                    Đăng ký miễn phí
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="h-12 px-7 text-sm font-bold text-white border-white/30 hover:bg-white/10 rounded-full backdrop-blur-sm"
                  >
                    Đăng nhập
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Trust Stats */}
          <div className="flex justify-center gap-10 md:gap-14">
            <div className="text-center">
              <p className="text-2xl font-black text-white">500+</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                Suất ăn/ngày
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">4.9 ⭐</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                Đánh giá
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                Hài lòng
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-orange-500 font-bold text-xs uppercase tracking-widest mb-2">
            Quy trình
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-black text-gray-900 mb-12">
            Đặt cơm chỉ với <span className="text-orange-500">3 bước</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Wallet,
                title: "Mua gói lượt",
                desc: "Chọn gói đặt cơm phù hợp, thanh toán nhanh gọn",
              },
              {
                step: "02",
                icon: UtensilsCrossed,
                title: "Chọn món & đặt",
                desc: "Xem menu hàng ngày, chọn món yêu thích và xác nhận",
              },
              {
                step: "03",
                icon: CheckCircle2,
                title: "Nhận cơm",
                desc: "Cơm tươi ngon, sẵn sàng phục vụ đúng giờ",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative text-center p-8 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-black rounded-full">
                  BƯỚC {item.step}
                </span>
                <div className="w-16 h-16 mx-auto mb-5 mt-2 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <item.icon size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TODAY MENU ===================== */}
      {menu && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full mb-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  ĐANG MỞ ĐẶT
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                  Menu hôm nay
                </h2>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                  <Timer size={16} className="text-orange-500" />
                  Thời gian: {menu.beginAt} — {menu.endAt}
                </p>
              </div>
              <Link to="/order">
                <Button className="h-12 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2 shadow-lg shadow-orange-200">
                  <ShoppingBag size={18} />
                  Đặt cơm ngay
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            <Card className="border-none shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="flex flex-wrap gap-3">
                  {menu.menuItems?.map((item: any) => (
                    <span
                      key={item._id}
                      className="px-4 py-2 bg-orange-50 text-orange-800 rounded-xl text-sm font-semibold border border-orange-100 hover:shadow-md transition-all"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
                {!menu.canOrder && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
                    <p className="text-yellow-700 font-medium text-sm">
                      Hiện tại ngoài thời gian đặt cơm. Vui lòng quay lại sau!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ===================== PACKAGES ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-orange-500 font-bold text-xs uppercase tracking-widest mb-2">
            Bảng giá
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-black text-gray-900 mb-3">
            Chọn gói phù hợp với bạn
          </h2>
          <p className="text-center text-gray-500 text-sm max-w-xl mx-auto mb-12">
            Mua gói nhiều lượt sẽ tiết kiệm hơn. Gói nào cũng linh hoạt sử dụng!
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePackages.slice(0, 6).map((pkg: any, i: number) => {
              const isPopular = i === 0;
              return (
                <div
                  key={pkg._id}
                  className={`rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
                    isPopular
                      ? "bg-gradient-to-br from-orange-500 to-red-500 p-[2px] shadow-xl shadow-orange-200"
                      : "border border-gray-200 hover:border-orange-300 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`h-full rounded-2xl p-7 ${isPopular ? "bg-white" : ""}`}
                  >
                    {isPopular && (
                      <div className="flex justify-center mb-4">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-black rounded-full uppercase tracking-wider">
                          <Star size={12} fill="white" />
                          Phổ biến nhất
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-black text-center text-gray-900 mb-1">
                      {pkg.name}
                    </h3>
                    <p className="text-center text-gray-400 text-sm mb-5">
                      {pkg.turns} lượt đặt cơm
                    </p>

                    <div className="text-center mb-5">
                      <p className="text-4xl font-black text-orange-600">
                        {formatVND(pkg.price)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        chỉ{" "}
                        <span className="font-bold text-orange-500">
                          ~{formatVND(Math.round(pkg.price / pkg.turns))}
                        </span>
                        /lượt
                      </p>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {[
                        `${pkg.turns} lượt đặt cơm`,
                        `Hiệu lực ${pkg.validDays} ngày`,
                        "Đặt món linh hoạt",
                        "Theo dõi đơn real-time",
                      ].map((f) => (
                        <div
                          key={f}
                          className="flex items-center gap-2.5 text-sm"
                        >
                          <CheckCircle2
                            size={15}
                            className={
                              isPopular ? "text-orange-500" : "text-emerald-500"
                            }
                          />
                          <span className="text-gray-600">{f}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      to={isAuthenticated ? `/packages/${pkg._id}` : "/login"}
                    >
                      <Button
                        className={`w-full h-11 rounded-xl font-bold text-sm ${
                          isPopular
                            ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                            : "border-gray-200 hover:border-orange-400 hover:text-orange-600"
                        }`}
                        variant={isPopular ? "default" : "outline"}
                      >
                        {isPopular ? "🔥 Mua ngay" : "Chọn gói này"}
                        <ArrowRight size={15} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link to="/packages">
              <Button
                variant="ghost"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-bold gap-2"
              >
                Xem tất cả các gói <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== WHY CHOOSE US ===================== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-orange-500 font-bold text-xs uppercase tracking-widest mb-2">
            Ưu điểm
          </p>
          <h2 className="text-center text-2xl md:text-3xl font-black text-gray-900 mb-12">
            Tại sao chọn chúng tôi?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ChefHat,
                title: "Cơm tươi ngon",
                desc: "Nấu mới mỗi ngày, nguyên liệu tươi sạch",
              },
              {
                icon: Timer,
                title: "Đặt siêu nhanh",
                desc: "Chỉ vài click, không cần gọi điện",
              },
              {
                icon: Shield,
                title: "Thanh toán an toàn",
                desc: "Mua gói trước, dùng dần, rõ ràng",
              },
              {
                icon: Users,
                title: "Hỗ trợ tận tình",
                desc: "Đội ngũ admin luôn sẵn sàng hỗ trợ",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                  <item.icon size={28} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            Sẵn sàng đặt cơm ngay?
          </h2>
          <p className="text-orange-100 text-base mb-8 max-w-lg mx-auto">
            Tham gia cùng hàng trăm khách hàng đã tin tưởng sử dụng.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to={isAuthenticated ? "/order" : "/register"}>
              <Button className="h-12 px-7 text-sm font-bold bg-white text-orange-600 hover:bg-orange-50 rounded-full shadow-lg gap-2">
                <Star size={18} />
                {isAuthenticated ? "Đặt cơm ngay" : "Bắt đầu miễn phí"}
              </Button>
            </Link>
            <Link to="/packages">
              <Button
                variant="outline"
                className="h-12 px-7 text-sm font-bold border-white/30 text-orange-600 hover:bg-white/10 rounded-full"
              >
                Xem bảng giá
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
