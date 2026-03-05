import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealPackagesApi, packagePurchasesApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { formatVND } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import {
  ArrowLeft,
  Package,
  Clock,
  QrCode,
  CreditCard,
  ShoppingCart,
  CheckCircle2,
  Shield,
  Loader2,
} from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ["mealPackage", id],
    queryFn: () => mealPackagesApi.getPackageById(id!),
    enabled: !!id,
  });

  const purchaseMutation = useMutation({
    mutationFn: () => packagePurchasesApi.createRequest(id!),
    onSuccess: async (response) => {
      toast({
        title: "✅ Đã gửi yêu cầu mua gói!",
        description:
          response.data.message || "Vui lòng chờ admin xác nhận thanh toán",
        variant: "success",
      });
      await queryClient.resetQueries({ queryKey: ["myPurchaseRequests"] });
      await queryClient.invalidateQueries({ queryKey: ["myPackages"] });
      navigate("/my-packages");
    },
    onError: (error: any) => {
      toast({
        title: "❌ Lỗi!",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!socket) return;
    const handleApproved = (data: any) => {
      if (data.requestId === id) {
        toast({
          title: "🎉 Tuyệt vời!",
          description: "Gói cơm này của bạn đã được Admin kích hoạt!",
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["mealPackage", id] });
        setTimeout(() => navigate("/my-packages"), 2000);
      }
    };
    socket.on("purchase_request_approved", handleApproved);
    return () => {
      socket.off("purchase_request_approved", handleApproved);
    };
  }, [socket, id, queryClient, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Đang tải thông tin gói...</p>
        </div>
      </div>
    );
  }

  const pkg = data?.data.data;

  if (!pkg) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Không tìm thấy gói
        </h2>
        <p className="text-gray-500 mb-6 text-sm">
          Gói này có thể đã bị xóa hoặc không tồn tại.
        </p>
        <Link to="/packages">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold">
            Quay lại danh sách gói
          </Button>
        </Link>
      </div>
    );
  }

  const isNoRice = pkg.packageType === "no-rice";
  const accentColor = isNoRice ? "blue" : "orange";
  const gradientFrom = isNoRice ? "from-blue-500" : "from-orange-500";
  const gradientTo = isNoRice ? "to-indigo-500" : "to-red-500";

  const transferContent = `${user?.name} MUA GOI DAT COM ${pkg.name}`.replace(
    /\s+/g,
    " ",
  );
  const bankCode = import.meta.env.VITE_BANK_CODE;
  const bankAccount = import.meta.env.VITE_BANK_ACCOUNT;
  const qrUrl =
    bankCode && bankAccount
      ? `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${pkg.price}&addInfo=${encodeURIComponent(transferContent)}`
      : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        to="/packages"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại danh sách gói
      </Link>

      {/* Main Card */}
      <div
        className={`rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-[2px] shadow-xl shadow-${accentColor}-100`}
      >
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div
            className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-8 text-white`}
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
                {isNoRice
                  ? pkg.turns <= 1
                    ? "🥢"
                    : pkg.turns <= 5
                      ? "�"
                      : "🥗"
                  : pkg.turns <= 1
                    ? "�🍱"
                    : pkg.turns <= 5
                      ? "🍲"
                      : "🍳"}
              </div>
              <div>
                <h1 className="text-2xl font-black">{pkg.name}</h1>
                <p className="text-white/80 text-sm font-medium mt-1">
                  {pkg.turns} lượt đặt {isNoRice ? "món (không cơm)" : "cơm"}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-end gap-3">
              <span className="text-4xl font-black">
                {formatVND(pkg.price)}
              </span>
              <span className="text-white/70 text-sm mb-1">
                ~{formatVND(Math.round(pkg.price / pkg.turns))}/lượt
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-7 space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Package,
                  label: "Số lượt",
                  value: `${pkg.turns} lượt`,
                },
                {
                  icon: Clock,
                  label: "Thời hạn",
                  value: `${pkg.validDays} ngày`,
                },
                {
                  icon: CreditCard,
                  label: "Giá gói",
                  value: formatVND(pkg.price),
                  highlight: true,
                },
                {
                  icon: ShoppingCart,
                  label: "Giá mỗi lượt",
                  value: formatVND(Math.round(pkg.price / pkg.turns)),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-${accentColor}-50 flex items-center justify-center`}
                  >
                    <item.icon
                      size={20}
                      className={`text-${accentColor}-500`}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">
                      {item.label}
                    </p>
                    <p
                      className={`font-bold text-sm ${
                        item.highlight
                          ? `text-${accentColor}-600`
                          : "text-gray-900"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-2.5">
              {[
                "Đặt món linh hoạt mỗi ngày",
                "Theo dõi đơn hàng real-time",
                "Nhận thông báo tức thì",
                "Hỗ trợ admin nhanh chóng",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span className="text-gray-600">{f}</span>
                </div>
              ))}
            </div>

            {/* QR Code */}
            <div className="p-6 bg-gray-50 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode size={18} className={`text-${accentColor}-500`} />
                <h3 className="font-bold text-gray-900 text-sm">
                  Quét mã QR để thanh toán
                </h3>
              </div>

              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Thanh toán"
                  className="mx-auto max-w-[260px] rounded-xl shadow-md border border-gray-100"
                />
              ) : (
                <div className="mx-auto w-48 h-48 bg-gray-200 rounded-xl flex items-center justify-center">
                  <p className="text-gray-500 text-sm text-center px-4">
                    Liên hệ admin để được hướng dẫn
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-1.5">
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Nội dung CK:</span>{" "}
                  {transferContent}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">Số tiền:</span>{" "}
                  <span className={`font-black text-${accentColor}-600`}>
                    {formatVND(pkg.price)}
                  </span>
                </p>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Sau khi chuyển khoản, nhấn nút "Mua gói" bên dưới
              </p>
            </div>

            {/* Buy Button */}
            <Button
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
              className={`w-full h-14 rounded-xl font-black text-base bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 text-white shadow-lg shadow-${accentColor}-200 transition-all`}
            >
              {purchaseMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShoppingCart size={20} />
                  MUA GÓI — {formatVND(pkg.price)}
                </span>
              )}
            </Button>

            {/* Note */}
            <div className="flex items-start gap-2.5 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Sau khi mua, admin sẽ xác nhận thanh toán và gói sẽ được kích
                hoạt. Bạn có thể theo dõi trạng thái tại trang "Gói của tôi".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
