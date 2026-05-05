import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  mealPackagesApi,
  packagePurchasesApi,
  vouchersApi,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Ticket,
  X,
  Wallet,
  Zap,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/contexts/SocketContext";
import { format } from "date-fns";

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { socket } = useSocket();
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: string;
    code: string;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["mealPackage", id],
    queryFn: () => mealPackagesApi.getPackageById(id!),
    enabled: !!id,
  });

  const pkg = data?.data.data;

  const { data: myVouchersData } = useQuery({
    queryKey: ["myVouchers"],
    queryFn: () => vouchersApi.getMyVouchers(),
    enabled: !!user,
  });

  const myVouchers = myVouchersData?.data.data || [];

  const purchaseMutation = useMutation({
    mutationFn: () =>
      packagePurchasesApi.createRequest(id!, appliedVoucher?.code),
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
        title: "❌ Gửi yêu cầu thất bại",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const checkVoucherMutation = useMutation({
    mutationFn: ({ code, amount }: { code: string; amount: number }) =>
      vouchersApi.checkVoucher(code, amount),
    onSuccess: (response) => {
      const data = response.data.data;
      if (!data) return;

      setAppliedVoucher({
        id: data.voucherId,
        code: data.code,
        discountAmount: data.discountAmount,
        finalPrice: data.finalPrice,
      });
      toast({
        title: "🎟️ Đã áp dụng mã!",
        description: `Bạn được giảm ${formatVND(data.discountAmount)}`,
        variant: "success",
      });
    },
    onError: (error: any) => {
      setAppliedVoucher(null);
      toast({
        title: "❌ Mã không hợp lệ",
        description: error.response?.data?.error?.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    },
  });

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;
    checkVoucherMutation.mutate({ code: voucherCode, amount: pkg?.price || 0 });
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
  };

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
    const handleVoucherUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["myVouchers"] });
      toast({
        title: "🎟️ Bạn có Voucher mới!",
        description: "Hãy mở Ví Voucher để kiểm tra và sử dụng ngay.",
        variant: "success",
      });
    };

    socket.on("purchase_request_approved", handleApproved);
    socket.on("voucher_created", handleVoucherUpdate);
    socket.on("voucher_updated", handleVoucherUpdate);

    return () => {
      socket.off("purchase_request_approved", handleApproved);
      socket.off("voucher_created", handleVoucherUpdate);
      socket.off("voucher_updated", handleVoucherUpdate);
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
  const displayPrice = appliedVoucher ? appliedVoucher.finalPrice : pkg.price;
  const qrUrl =
    bankCode && bankAccount
      ? `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?amount=${displayPrice}&addInfo=${encodeURIComponent(transferContent)}`
      : null;

  return (
    <>
      <div className="max-w-2xl mx-auto">
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách gói
        </Link>

        <div
          className={`rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} p-[2px] shadow-xl shadow-${accentColor}-100`}
        >
          <div className="bg-white rounded-2xl overflow-hidden">
            <div
              className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} p-8 text-white`}
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl">
                  {isNoRice
                    ? pkg.turns <= 5
                      ? "🥗"
                      : "🥙"
                    : pkg.turns <= 5
                      ? "🍲"
                      : "🍱"}
                </div>
                <div>
                  <h1 className="text-2xl font-black">{pkg.name}</h1>
                  <p className="text-white/80 text-sm font-medium mt-1">
                    {pkg.turns} lượt đặt {isNoRice ? "món (không cơm)" : "cơm"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-3">
                <span className="text-4xl font-black">
                  {formatVND(pkg.price)}
                </span>
                <span className="text-white/70 text-sm mb-1">
                  ~{formatVND(Math.round(pkg.price / pkg.turns))}/lượt
                </span>
              </div>
            </div>

            <div className="p-7 space-y-6">
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
                        className={`font-bold text-sm ${item.highlight ? `text-${accentColor}-600` : "text-gray-900"}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

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
                      {formatVND(displayPrice)}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Sau khi chuyển khoản, nhấn nút "Mua gói" bên dưới
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Ticket size={16} className="text-orange-500" />
                    Mã giảm giá
                  </h3>
                  {myVouchers.length > 0 && !appliedVoucher && (
                    <button
                      onClick={() => setIsVoucherModalOpen(true)}
                      className="text-[10px] font-bold text-orange-600 flex items-center gap-1 hover:underline"
                    >
                      <Wallet size={12} />
                      VÍ VOUCHER ({myVouchers.length})
                    </button>
                  )}
                </div>

                {!appliedVoucher ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập mã voucher..."
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      className="rounded-xl border-gray-200"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyVoucher}
                      disabled={
                        !voucherCode.trim() || checkVoucherMutation.isPending
                      }
                      className="rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-bold"
                    >
                      {checkVoucherMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        "Áp dụng"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-700">
                        Mã: {appliedVoucher.code} (-
                        {formatVND(appliedVoucher.discountAmount)})
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="p-1 hover:bg-emerald-100 rounded-full transition-colors text-emerald-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {appliedVoucher && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá gốc:</span>
                    <span className="text-gray-900 font-medium line-through">
                      {formatVND(pkg.price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giảm giá:</span>
                    <span className="text-emerald-600 font-bold">
                      -{formatVND(appliedVoucher.discountAmount)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-900">
                      Tổng thanh toán:
                    </span>
                    <span className="text-xl font-black text-orange-600">
                      {formatVND(appliedVoucher.finalPrice)}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => purchaseMutation.mutate()}
                disabled={purchaseMutation.isPending}
                className={`w-full h-14 rounded-xl font-black text-base bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 text-white shadow-lg shadow-${accentColor}-200 transition-all`}
              >
                {purchaseMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={20} className="animate-spin" /> Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={20} /> MUA GÓI —{" "}
                    {formatVND(displayPrice)}
                  </span>
                )}
              </Button>

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

      <Dialog open={isVoucherModalOpen} onOpenChange={setIsVoucherModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
          <DialogHeader className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Ví Voucher của tôi
                </DialogTitle>
                <p className="text-white/80 text-xs font-medium">
                  Chọn mã giảm giá để áp dụng cho gói này
                </p>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] p-6">
            <div className="space-y-3">
              {myVouchers.length === 0 ? (
                <div className="py-10 text-center">
                  <Ticket size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm font-medium">
                    Bạn chưa có mã giảm giá nào
                  </p>
                </div>
              ) : (
                myVouchers.map((v: any) => {
                  const isEligible =
                    !v.minPurchase || pkg.price >= v.minPurchase;
                  return (
                    <div
                      key={v._id}
                      onClick={() => {
                        if (isEligible) {
                          setVoucherCode(v.code);
                          setIsVoucherModalOpen(false);
                          checkVoucherMutation.mutate(
                            { code: v.code, amount: pkg.price },
                            {
                              onSuccess: (response) => {
                                const data = response.data.data;
                                if (data) {
                                  setAppliedVoucher({
                                    id: data.voucherId,
                                    code: data.code,
                                    discountAmount: data.discountAmount,
                                    finalPrice: data.finalPrice,
                                  });
                                  toast({
                                    title: `✅ Đã áp dụng mã ${data.code}`,
                                    variant: "success",
                                  });
                                }
                              },
                              onError: (error: any) => {
                                toast({
                                  title: "❌ Không thể áp dụng mã",
                                  description:
                                    error.response?.data?.error?.message ||
                                    "Mã không hợp lệ",
                                  variant: "destructive",
                                });
                              },
                            },
                          );
                        }
                      }}
                      className={`relative group p-4 border rounded-2xl transition-all ${isEligible ? "cursor-pointer hover:border-orange-500 hover:bg-orange-50/30" : "opacity-60 grayscale cursor-not-allowed"} border-gray-100 bg-white`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                              {v.code}
                            </span>
                            <Badge className="bg-orange-100 text-orange-600 text-[9px] font-bold uppercase px-1.5 h-4.5 border-none">
                              {v.discountType === "fixed"
                                ? `-${formatVND(v.discountValue)}`
                                : `-${v.discountValue}%`}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-2">
                            {v.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> Hạn:{" "}
                              {format(new Date(v.validTo), "dd/MM")}
                            </span>
                            {v.minPurchase > 0 && (
                              <span className="flex items-center gap-1">
                                <Tag size={10} /> Min:{" "}
                                {formatVND(v.minPurchase)}
                              </span>
                            )}
                          </div>
                        </div>
                        {isEligible && (
                          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <Zap size={14} />
                          </div>
                        )}
                      </div>
                      {!isEligible && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-100">
                          <p className="text-[10px] text-rose-500 font-bold">
                            Chưa đạt giá trị tối thiểu{" "}
                            {formatVND(v.minPurchase)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <button
              onClick={() => setIsVoucherModalOpen(false)}
              className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
            >
              Đóng
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
