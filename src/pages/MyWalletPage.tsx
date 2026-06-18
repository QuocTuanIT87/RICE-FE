import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  depositRequestsApi,
  gameCoinsApi,
  authApi,
  vouchersApi,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND, formatDate, cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import { swalAlert, swalToast } from "@/utils/swal";
import {
  Clock,
  History,
  RefreshCw,
  Loader2,
  Wallet,
  Coins,
  TrendingUp,
  Copy,
  Check,
  Eye,
  EyeOff,
  Ticket,
} from "lucide-react";
import { useShowBalance } from "@/hooks/useShowBalance";
import { useSocket } from "@/contexts/SocketContext";

export default function MyWalletPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const [showBalance, setShowBalance] = useShowBalance();

  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [coinExchangeTurns, setCoinExchangeTurns] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [submittingExchange, setSubmittingExchange] = useState(false);

  const { data: myDepositVouchersData } = useQuery({
    queryKey: ["myDepositVouchers"],
    queryFn: () => vouchersApi.getMyVouchers("deposit"),
  });
  const depositVouchers = myDepositVouchersData?.data.data || [];

  useEffect(() => {
    setAppliedVoucher(null);
    setVoucherCode("");
  }, [depositAmount]);

  const handleApplyVoucher = async (codeToApply?: string) => {
    const targetCode = codeToApply || voucherCode;
    if (!targetCode) return;
    if (depositAmount <= 0) {
      swalAlert({
        title: "⚠️ Số tiền nạp không hợp lệ",
        text: "Vui lòng nhập số tiền nạp trước khi áp dụng mã giảm giá",
        icon: "warning",
      });
      return;
    }

    setCheckingVoucher(true);
    try {
      const res = await vouchersApi.checkVoucher(
        targetCode,
        depositAmount,
        "deposit",
      );
      const voucherData = res.data.data;
      if (!voucherData) {
        throw new Error("Mã voucher không hợp lệ hoặc không đúng loại");
      }
      setAppliedVoucher(voucherData);
      setVoucherCode(targetCode.toUpperCase());
      swalAlert({
        title: "✅ Áp dụng mã thành công!",
        text: `Bạn sẽ được cộng thêm ${voucherData.discountAmount.toLocaleString("vi-VN")}đ vào tài khoản khi được duyệt!`,
        icon: "success",
      });
    } catch (err: any) {
      swalAlert({
        title: "❌ Lỗi áp dụng mã",
        text: err.response?.data?.error?.message || "Mã voucher không hợp lệ",
        icon: "error",
      });
      setAppliedVoucher(null);
    } finally {
      setCheckingVoucher(false);
    }
  };

  const { config: systemConfig } = useAppSelector((state) => state.system);

  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isFetching: isFetchingProfile,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });

  const {
    data: requestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useQuery({
    queryKey: ["myDepositRequests"],
    queryFn: () => depositRequestsApi.getMyRequests(),
  });

  const handleRefetchAll = () => {
    refetchProfile();
    refetchRequests();
  };

  useEffect(() => {
    if (!socket) return;
    const handleApproved = (data: any) => {
      toast({
        title: "🎉 Nạp tiền thành công!",
        description:
          data.message || "Yêu cầu nạp tiền của bạn đã được phê duyệt.",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["myDepositRequests"] });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    };
    const handleRejected = (data: any) => {
      toast({
        title: "❌ Rất tiếc",
        description: data.message || "Yêu cầu nạp tiền của bạn đã bị từ chối.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["myDepositRequests"] });
    };
    socket.on("purchase_request_approved", handleApproved);
    socket.on("purchase_request_rejected", handleRejected);
    return () => {
      socket.off("purchase_request_approved", handleApproved);
      socket.off("purchase_request_rejected", handleRejected);
    };
  }, [socket, queryClient]);

  const user = profileData?.data.data;
  const requests = requestsData?.data.data || [];
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const isLoading = profileLoading || requestsLoading;
  const isRefetching = isFetchingProfile || isFetchingRequests;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    swalToast({
      title: `Đã sao chép ${fieldName} vào bộ nhớ tạm.`,
      icon: "success",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateDeposit = async () => {
    if (depositAmount < 1000) {
      swalAlert({
        title: "Lỗi số tiền",
        text: "Số tiền nạp tối thiểu là 1,000 VND.",
        icon: "warning",
      });
      return;
    }
    setSubmittingDeposit(true);
    try {
      await depositRequestsApi.createRequest(
        depositAmount,
        voucherCode || undefined,
      );
      swalAlert({
        title: "⚽ Yêu cầu nạp tiền thành công! SIUUUUU!",
        text: "Đã gửi yêu cầu nạp tiền, vui lòng đợi Admin phê duyệt.",
        icon: null,
        imageUrl: "/ronaldo_left.png",
        imageWidth: 280,
        imageAlt: "Ronaldo Siuuu",
      });
      setDepositAmount(0);
      setVoucherCode("");
      setAppliedVoucher(null);
      queryClient.invalidateQueries({ queryKey: ["myDepositRequests"] });
    } catch (error: any) {
      swalAlert({
        title: "Lỗi nạp tiền",
        text:
          error.response?.data?.error?.message || "Không thể tạo yêu cầu nạp.",
        icon: "error",
      });
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleExchangeCoins = async () => {
    if (coinExchangeTurns <= 0) return;
    const coinsNeeded = coinExchangeTurns * 100000;
    if ((user?.gameCoins || 0) < coinsNeeded) {
      swalAlert({
        title: "Không đủ xu",
        text: "Bạn không có đủ xu để thực hiện giao dịch này.",
        icon: "warning",
      });
      return;
    }
    setSubmittingExchange(true);
    try {
      await gameCoinsApi.exchange(coinExchangeTurns);
      swalAlert({
        title: "Đổi xu thành công!",
        text: `Đã đổi ${coinExchangeTurns} lượt, cộng ${formatVND(coinExchangeTurns * 30000)} vào ví!`,
        icon: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    } catch (error: any) {
      swalAlert({
        title: "Lỗi đổi xu",
        text:
          error.response?.data?.error?.message || "Giao dịch đổi xu thất bại.",
        icon: "error",
      });
    } finally {
      setSubmittingExchange(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">
            Đang tải thông tin ví...
          </p>
        </div>
      </div>
    );
  }

  // VietQR Code generation
  const bankId = systemConfig?.bankId || "MB";
  const bankAccountNo = systemConfig?.bankAccountNo || "0999999999";
  const bankAccountName = systemConfig?.bankAccountName || "NGUYEN VAN A";
  const transferContent =
    depositAmount > 0
      ? `${user?.name || ""} NAP ${depositAmount} VND VAO WEB`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/Đ/g, "D")
          .toUpperCase()
      : "";

  const qrCodeUrl =
    depositAmount > 0
      ? `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact.png?amount=${depositAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankAccountName)}`
      : "";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-1">
            Tài chính
          </p>
          <h1 className="text-2xl font-black text-gray-900">Ví tiền của tôi</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefetchAll}
          disabled={isRefetching}
          className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
        >
          <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Wallet Balance Overview Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Cash Balance Card */}
        <Card className="border border-orange-100 bg-gradient-to-br from-white to-orange-50/20 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Số dư ví hiện tại
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black text-gray-900">
                    {showBalance ? formatVND(user?.balance || 0) : "••••••"}
                  </h2>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-50/50 focus:outline-none"
                    title={showBalance ? "Ẩn số dư" : "Hiện số dư"}
                  >
                    {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                <Wallet size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <TrendingUp size={14} className="text-emerald-500" />
                Có cơm {formatVND(systemConfig?.priceNormal || 30000)} • Không
                cơm {formatVND(systemConfig?.priceNoRice || 20000)}
              </span>
              <span>Tự động trừ khi chốt</span>
            </div>
          </CardContent>
        </Card>

        {/* Game Coins Card */}
        <Card className="border border-amber-100 bg-gradient-to-br from-white to-amber-50/20 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Xu chơi game giải trí
                </p>
                <h2 className="text-3xl font-black text-amber-600">
                  {(user?.gameCoins || 0).toLocaleString()}{" "}
                  <span className="text-sm font-bold text-amber-500">Xu</span>
                </h2>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <Coins size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">
                Đổi xu lấy số dư ví đặt cơm
              </span>
              <span className="text-amber-500 font-bold">
                100k xu = 30k VND
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Operations Block */}
      <div className="grid md:grid-cols-12 gap-8">
        {/* Deposit/Topup Panel */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Nạp tiền vào tài khoản
                </h3>
                <p className="text-xs text-gray-500">
                  Nhập số tiền muốn nạp. Quét mã QR VietQR để chuyển khoản
                  nhanh.
                </p>
              </div>

              {/* Amount input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Số tiền nạp (VND)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount || ""}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    placeholder="Nhập số tiền (ví dụ: 100000)"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-gray-900 text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                    VND
                  </span>
                </div>

                {/* Preset amount buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        depositAmount === amt
                          ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      +{amt / 1000}K
                    </button>
                  ))}
                </div>

                {/* Voucher Selection Section */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5 pl-0.5">
                      <Ticket size={14} className="text-orange-500" />
                      Mã khuyến mãi nạp tiền
                    </label>
                    {appliedVoucher && (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        Đã áp dụng
                      </span>
                    )}
                  </div>

                  {/* Input and Apply button */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="Nhập mã voucher (ví dụ: TANG10)"
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                    <Button
                      type="button"
                      onClick={() => handleApplyVoucher()}
                      disabled={checkingVoucher || !voucherCode}
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold h-9 px-4 shrink-0 shadow-sm"
                    >
                      {checkingVoucher ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Áp dụng"
                      )}
                    </Button>
                  </div>

                  {/* List of available vouchers */}
                  {depositVouchers.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">
                        Mã khuyến mãi khả dụng của đạo hữu:
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                        {depositVouchers.map((v: any) => (
                          <button
                            key={v._id}
                            type="button"
                            onClick={() => {
                              setVoucherCode(v.code);
                              handleApplyVoucher(v.code);
                            }}
                            className={cn(
                              "px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all text-left flex flex-col gap-0.5",
                              voucherCode === v.code
                                ? "bg-orange-50 border-orange-300 text-orange-700 shadow-sm"
                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600",
                            )}
                          >
                            <span className="font-black uppercase tracking-wide">
                              {v.code}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium line-clamp-1">
                              {v.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {depositAmount > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex flex-col items-center p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                    <p className="text-xs font-bold text-orange-800 mb-3 uppercase tracking-wide">
                      Mã QR chuyển khoản VietQR
                    </p>
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-orange-100">
                      <img
                        src={qrCodeUrl}
                        alt="VietQR"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">
                      Mã QR này tự động chứa số tiền và nội dung chuyển khoản
                      của bạn.
                    </p>
                  </div>

                  {/* Copy details block */}
                  <div className="space-y-2.5">
                    <p className="text-xs font-bold text-gray-700 uppercase">
                      Thông tin chuyển khoản
                    </p>

                    <div className="space-y-1.5 text-xs">
                      {/* Bank */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">Ngân hàng:</span>
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <span>{bankId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(bankId, "Ngân hàng")}
                            className="text-orange-500 hover:text-orange-600 p-0.5"
                          >
                            {copiedField === "Ngân hàng" ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Account No */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <span>{bankAccountNo}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(bankAccountNo, "Số tài khoản")
                            }
                            className="text-orange-500 hover:text-orange-600 p-0.5"
                          >
                            {copiedField === "Số tài khoản" ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Account Name */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">Chủ tài khoản:</span>
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <span>{bankAccountName}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(bankAccountName, "Tên tài khoản")
                            }
                            className="text-orange-500 hover:text-orange-600 p-0.5"
                          >
                            {copiedField === "Tên tài khoản" ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">Số tiền chuyển:</span>
                        <div className="flex items-center gap-1.5 font-bold  text-orange-600">
                          <span>{formatVND(depositAmount)}</span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(depositAmount.toString(), "Số tiền")
                            }
                            className="text-orange-500 hover:text-orange-600 p-0.5"
                          >
                            {copiedField === "Số tiền" ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {appliedVoucher && (
                        <>
                          <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs">
                            <span className="text-emerald-700font-bold">
                              Khuyến mãi nhận thêm:
                            </span>
                            <span className="font-black text-emerald-600">
                              +{formatVND(appliedVoucher.discountAmount || 0)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg text-xs">
                            <span className="text-indigo-700 font-bold">
                              Tổng tiền nhận được:
                            </span>
                            <span className="font-black text-indigo-600 text-sm">
                              {formatVND(
                                depositAmount +
                                  (appliedVoucher.discountAmount || 0),
                              )}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Content */}
                      <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                        <span className="text-gray-500">
                          Nội dung chuyển khoản:
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-gray-950 break-all">
                          <span className="break-all font-mono font-black tracking-wide text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                            {transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(transferContent, "Nội dung")
                            }
                            className="text-orange-500 hover:text-orange-600 p-0.5"
                          >
                            {copiedField === "Nội dung" ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completed transfer button */}
                  <Button
                    onClick={handleCreateDeposit}
                    disabled={submittingDeposit}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-100 transition-all text-sm gap-2"
                  >
                    {submittingDeposit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang gửi yêu cầu...
                      </>
                    ) : (
                      "Tôi đã hoàn tất chuyển khoản"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coin Exchange Panel */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border border-gray-200 shadow-sm bg-gradient-to-b from-white to-amber-50/10">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Quy đổi xu game
                </h3>
                <p className="text-xs text-gray-500">
                  Quy đổi xu game tích lũy từ trò chơi thành tiền ví đặt cơm
                  trực tiếp.
                </p>
              </div>

              {/* Cost & Exchange info */}
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tỷ lệ quy đổi:</span>
                  <span className="font-bold text-amber-700">
                    100.000 Xu = 30.000 VND
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Xu hiện có:</span>
                  <span className="font-bold text-gray-900">
                    {(user?.gameCoins || 0).toLocaleString()} Xu
                  </span>
                </div>
              </div>

              {/* Turns selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Chọn số lượt đổi
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 5, 10, 20].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCoinExchangeTurns(t)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        coinExchangeTurns === t
                          ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      {t} lượt
                    </button>
                  ))}
                </div>

                <div className="pt-3 flex flex-col gap-1.5 text-xs border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tiêu tốn:</span>
                    <span className="font-bold text-amber-600">
                      {(coinExchangeTurns * 100000).toLocaleString()} Xu
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nhận được:</span>
                    <span className="font-black text-emerald-600">
                      +{formatVND(coinExchangeTurns * 30000)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleExchangeCoins}
                disabled={
                  submittingExchange ||
                  (user?.gameCoins || 0) < coinExchangeTurns * 100000
                }
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-100 transition-all text-xs gap-2"
              >
                {submittingExchange ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang quy đổi...
                  </>
                ) : (
                  "Đồng ý quy đổi xu"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== Pending Requests ========== */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
            <Clock size={18} className="text-amber-600" />
            <h2 className="font-bold text-amber-900 text-sm md:text-base">
              Yêu cầu nạp tiền đang chờ xác nhận ({pendingRequests.length})
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req._id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-100 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">
                      Yêu cầu nạp tiền ví
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Chuyển khoản:{" "}
                      <span className="font-bold text-orange-600">
                        {formatVND(req.amount)}
                      </span>{" "}
                      {req.voucherCode && (
                        <>
                          {" "}
                          • Voucher:{" "}
                          <span className="font-black text-indigo-600 uppercase">
                            {req.voucherCode} (+
                            {formatVND(req.bonusAmount || 0)})
                          </span>
                        </>
                      )}{" "}
                      • Trạng thái:{" "}
                      <span className="font-semibold text-amber-600">
                        Chờ duyệt
                      </span>
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                  ⏳ Chờ duyệt
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== Transaction History ========== */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
            <History size={16} />
          </div>
          <h2 className="font-bold text-gray-900">Lịch sử nạp tiền</h2>
          <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
            {requests.length}
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
              <History size={28} />
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Bạn chưa có giao dịch nạp tiền nào
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Ngày yêu cầu
                  </th>
                  <th className="text-left px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Loại giao dịch
                  </th>
                  <th className="text-right px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Số tiền nạp
                  </th>
                  <th className="text-center px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...requests]
                  .sort(
                    (a, b) =>
                      new Date(b.requestedAt).getTime() -
                      new Date(a.requestedAt).getTime(),
                  )
                  .map((req) => {
                    const statusConfig = (
                      {
                        pending: {
                          label: "Đang chờ",
                          class:
                            "bg-amber-50 text-amber-700 border border-amber-200",
                        },
                        approved: {
                          label: "Đã duyệt",
                          class:
                            "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        },
                        rejected: {
                          label: "Từ chối",
                          class:
                            "bg-rose-50 text-rose-600 border border-rose-200",
                        },
                      } as Record<string, { label: string; class: string }>
                    )[req.status] || {
                      label: req.status,
                      class: "bg-gray-100 text-gray-600 border border-gray-200",
                    };

                    return (
                      <tr
                        key={req._id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-gray-500 text-xs">
                          {formatDate(req.requestedAt)}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-900 text-sm">
                          <div>Nạp tiền vào ví</div>
                          {req.voucherCode && (
                            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-wide mt-0.5">
                              Voucher: {req.voucherCode} (
                              {req.status === "approved"
                                ? "đã cộng"
                                : "chờ cộng"}{" "}
                              +{formatVND(req.bonusAmount || 0)})
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-emerald-600 text-sm">
                          <div>
                            +
                            {formatVND(
                              req.status === "approved"
                                ? req.amount + (req.bonusAmount || 0)
                                : req.amount,
                            )}
                          </div>
                          {req.bonusAmount && req.status === "approved" && (
                            <div className="text-[10px] text-gray-400 font-medium">
                              (Khuyến mãi: +{formatVND(req.bonusAmount)})
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusConfig.class}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
