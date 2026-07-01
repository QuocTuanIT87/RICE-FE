import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { depositRequestsApi, authApi, vouchersApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatVND, formatDate, cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import { useAppSelector } from "@/store/hooks";
import { swalAlert, swalToast } from "@/utils/swal";
import { VipMascotInline } from "@/components/VipMascots";
import {
  Clock,
  History,
  RefreshCw,
  Loader2,
  Wallet,
  TrendingUp,
  Copy,
  Check,
  Eye,
  EyeOff,
  Ticket,
  Crown,
} from "lucide-react";
import { useShowBalance } from "@/hooks/useShowBalance";
import { useSocket } from "@/contexts/SocketContext";

export default function MyWalletPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();

  const [showBalance, setShowBalance] = useShowBalance();

  const [activeTab, setActiveTab] = useState("deposit");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [checkingVoucher, setCheckingVoucher] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [depositRequestType, setDepositRequestType] = useState("normal");
  const [depositVipPackageId, setDepositVipPackageId] = useState("");

  const { data: myDepositVouchersData } = useQuery({
    queryKey: ["myDepositVouchers"],
    queryFn: () => vouchersApi.getMyVouchers("deposit"),
  });
  const depositVouchers = myDepositVouchersData?.data.data || [];

  // Read search parameters for automatic tab switcher/depositing for VIP packages
  useEffect(() => {
    const tab = searchParams.get("tab");
    const amount = searchParams.get("amount");
    const type = searchParams.get("type");
    const pkgId = searchParams.get("pkgId");

    if (tab && ["deposit", "pending", "history"].includes(tab)) {
      setActiveTab(tab);
    }
    if (amount) {
      setDepositAmount(Number(amount));
    }
    if (type === "buy_membership" && pkgId) {
      setDepositRequestType("buy_membership");
      setDepositVipPackageId(pkgId);
    }
  }, [searchParams]);

  useEffect(() => {
    setAppliedVoucher(null);
    setVoucherCode("");

    // Check if depositAmount changed from the programmatically set package price
    const searchAmount = Number(searchParams.get("amount"));
    if (
      depositRequestType === "buy_membership" &&
      depositAmount !== searchAmount
    ) {
      setDepositRequestType("normal");
      setDepositVipPackageId("");
    }
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

  useEffect(() => {
    setPendingPage(1);
  }, [pendingRequests.length]);

  useEffect(() => {
    setHistoryPage(1);
  }, [requests.length]);

  const isLoading = profileLoading || requestsLoading;
  const isRefetching = isFetchingProfile || isFetchingRequests;

  const ITEMS_PER_PAGE = 5;

  const totalPendingPages = Math.ceil(pendingRequests.length / ITEMS_PER_PAGE);
  const pendingStartIndex = (pendingPage - 1) * ITEMS_PER_PAGE;
  const paginatedPendingRequests = pendingRequests.slice(
    pendingStartIndex,
    pendingStartIndex + ITEMS_PER_PAGE,
  );

  const sortedHistoryRequests = [...requests].sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
  );
  const totalHistoryPages = Math.ceil(
    sortedHistoryRequests.length / ITEMS_PER_PAGE,
  );
  const historyStartIndex = (historyPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistoryRequests = sortedHistoryRequests.slice(
    historyStartIndex,
    historyStartIndex + ITEMS_PER_PAGE,
  );

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
    if (depositAmount < 10000) {
      swalAlert({
        title: "Lỗi nạp tiền",
        text: "Đạo hữu vui lòng nạp tối thiểu 10,000 linh thạch.",
        icon: "warning",
      });
      return;
    }
    setSubmittingDeposit(true);
    try {
      await depositRequestsApi.createRequest(
        depositAmount,
        voucherCode || undefined,
        depositRequestType,
        depositVipPackageId || undefined,
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
      ? depositRequestType === "buy_membership"
        ? `${user?.name || ""} MUA GOI VIP ${depositVipPackageId.slice(-6)}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toUpperCase()
        : `${user?.name || ""} NAP ${depositAmount} VND VAO WEB`
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

        {/* VIP Rank Card */}
        <Card className="border border-amber-100 bg-gradient-to-br from-white to-amber-50/20 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Trạng thái hội viên VIP
                </p>
                <h2 className="text-xl font-black text-amber-600 uppercase tracking-wide italic">
                  {user?.hasMembership
                    ? user.membershipName
                    : "Thành viên thường"}
                </h2>
              </div>
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                <Crown size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">
                {user?.hasMembership ? (
                  <>
                    Hạn dùng:{" "}
                    <span className="font-bold text-gray-900">
                      {formatDate(user.membershipExpiresAt!)}
                    </span>
                  </>
                ) : (
                  "Đăng ký gói VIP để hưởng ưu đãi"
                )}
              </span>
              <Link
                to="/vip"
                className="text-amber-500 hover:text-amber-600 font-black flex items-center gap-0.5"
              >
                {user?.hasMembership ? "Quản lý VIP →" : "Đăng ký ngay →"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Mascot Inline Advisor */}
      <VipMascotInline className="max-w-2xl mx-auto" />

      {/* Main Operations Block */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-2xl h-11 mb-2">
          <TabsTrigger
            value="deposit"
            className="rounded-xl font-bold text-xs md:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
          >
            NẠP TIỀN
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="rounded-xl font-bold text-xs md:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm relative"
          >
            YÊU CẦU ĐANG CHỜ
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-bounce">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl font-bold text-xs md:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
          >
            LỊCH SỬ NẠP TIỀN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit" className="mt-0">
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
                        onChange={(e) =>
                          setDepositAmount(Number(e.target.value))
                        }
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

                  {depositAmount >= 10000 && (
                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <div className="flex flex-col items-center p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                        <p className="text-xs font-bold text-orange-800 mb-3 uppercase tracking-wide">
                          Mã QR chuyển khoản VietQR
                        </p>
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-orange-100">
                          <img
                            src={qrCodeUrl}
                            alt="VietQR Transfer Code"
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 text-center">
                          Vui lòng quét mã trên bằng ứng dụng ngân hàng để tự
                          động điền thông tin chuyển khoản chính xác.
                        </p>
                      </div>

                      {/* Bank Details list */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-700 uppercase">
                          Thông tin chuyển khoản thủ công
                        </p>

                        {/* Bank name */}
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
                          <span className="text-gray-500">Ngân hàng:</span>
                          <span className="font-bold text-gray-900">
                            {bankId}
                          </span>
                        </div>

                        {/* Account number */}
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
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

                        {/* Account name */}
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
                          <span className="text-gray-500">Chủ tài khoản:</span>
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 uppercase">
                            <span>{bankAccountName}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(bankAccountName, "Chủ tài khoản")
                              }
                              className="text-orange-500 hover:text-orange-600 p-0.5"
                            >
                              {copiedField === "Chủ tài khoản" ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Amount display */}
                        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-xs">
                          <span className="text-gray-500">Số tiền nạp:</span>
                          <span className="font-black text-orange-600">
                            {formatVND(depositAmount)}
                          </span>
                        </div>

                        {appliedVoucher && (
                          <>
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs">
                              <span className="text-emerald-700 font-bold">
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
                          <div className="flex items-center gap-1.5 font-bold text-gray-955 break-all">
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
                  )}

                  {/* Completed transfer button */}
                  <Button
                    onClick={handleCreateDeposit}
                    disabled={
                      submittingDeposit || !depositAmount || depositAmount <= 0
                    }
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
                </CardContent>
              </Card>
            </div>

            {/* VIP Perks Card */}
            <div className="md:col-span-5 space-y-6">
              <Card className="border border-amber-200 bg-gradient-to-b from-white to-amber-50/10 shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center text-amber-600">
                      <Crown size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900">
                        Đặc quyền Hội Viên VIP
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Khi kích hoạt gói hội viên, bạn sẽ nhận được
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                        $
                      </div>
                      <div>
                        <span className="text-xs text-gray-900 font-bold block animate-fade-in">
                          Tiết kiệm chi phí ăn trưa
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Khấu trừ trực tiếp tiền mặt (ví dụ: 2,000đ) trên mỗi
                          phần cơm đặt trong thời hạn gói.
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black shrink-0">
                        🎨
                      </div>
                      <div>
                        <span className="text-xs text-gray-900 font-bold block">
                          Cá nhân hóa giao diện VIP
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Tùy chọn chủ đề ứng dụng Hoàng Kim, Đêm Huyền Bí, Hoa
                          Anh Đào trong trang cá nhân.
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black shrink-0">
                        👑
                      </div>
                      <div>
                        <span className="text-xs text-gray-900 font-bold block">
                          Khung Viền & Tên Nổi Bật
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Trang bị khung Avatar VIP (Vương miện, Neon, Kim
                          cương) và hiển thị tên lấp lánh khi tương tác trên
                          Diễn đàn công ty.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-400 leading-relaxed pt-2 border-t border-dashed border-gray-200">
                    💡 <span className="font-bold text-gray-500">Lưu ý:</span>{" "}
                    Phí dịch vụ mua gói hội viên VIP là phí mua đứt dịch vụ và
                    không được hoàn lại vào ví sau khi đã kích hoạt thành công.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              <h2 className="font-bold text-amber-900 text-sm md:text-base">
                Yêu cầu nạp tiền đang chờ xác nhận ({pendingRequests.length})
              </h2>
            </div>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 bg-white p-6">
                <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500">
                  <Clock size={28} />
                </div>
                <p className="text-gray-500 text-sm font-bold">
                  Không có yêu cầu nạp tiền nào đang chờ duyệt
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Khi đạo hữu gửi một yêu cầu nạp tiền mới, nó sẽ xuất hiện ở
                  đây để chờ Admin phê duyệt.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-2">
                  {paginatedPendingRequests.map((req) => (
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
                            {req.requestType === "buy_membership"
                              ? "Yêu cầu mua gói VIP"
                              : "Yêu cầu nạp tiền ví"}
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

                {totalPendingPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-3 border-t border-amber-200/50 bg-amber-50/50">
                    <span className="text-[11px] text-amber-800 font-medium">
                      Hiển thị {pendingStartIndex + 1} -{" "}
                      {Math.min(
                        pendingStartIndex + ITEMS_PER_PAGE,
                        pendingRequests.length,
                      )}{" "}
                      trong tổng số {pendingRequests.length} yêu cầu
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={pendingPage === 1}
                        className="h-7 px-2.5 rounded-lg border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 disabled:opacity-50 text-[11px] font-bold"
                      >
                        Trước
                      </Button>
                      {Array.from(
                        { length: totalPendingPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          onClick={() => setPendingPage(page)}
                          className={cn(
                            "h-7 w-7 p-0 rounded-lg text-[11px] font-bold",
                            pendingPage === page
                              ? "bg-amber-600 text-white border-none hover:bg-amber-700 shadow-sm"
                              : "border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900",
                          )}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingPage((prev) =>
                            Math.min(prev + 1, totalPendingPages),
                          )
                        }
                        disabled={pendingPage === totalPendingPages}
                        className="h-7 px-2.5 rounded-lg border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 disabled:opacity-50 text-[11px] font-bold"
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
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
              <>
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
                      {paginatedHistoryRequests.map((req) => {
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
                          class:
                            "bg-gray-100 text-gray-600 border border-gray-200",
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
                              <div>
                                {req.requestType === "buy_membership"
                                  ? "Mua gói Hội Viên VIP"
                                  : "Nạp tiền vào ví"}
                              </div>
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

                {totalHistoryPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <span className="text-xs text-gray-500 font-medium">
                      Hiển thị {historyStartIndex + 1} -{" "}
                      {Math.min(
                        historyStartIndex + ITEMS_PER_PAGE,
                        requests.length,
                      )}{" "}
                      trong tổng số {requests.length} giao dịch
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHistoryPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={historyPage === 1}
                        className="h-8 px-3 rounded-xl font-bold text-xs"
                      >
                        Trước
                      </Button>
                      {Array.from(
                        { length: totalHistoryPages },
                        (_, i) => i + 1,
                      ).map((page) => (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(page)}
                          className={cn(
                            "h-8 w-8 p-0 rounded-xl font-bold text-xs",
                            historyPage === page
                              ? "bg-orange-500 text-white border-none hover:bg-orange-600 shadow-sm"
                              : "text-gray-600 hover:text-orange-500 hover:bg-orange-50",
                          )}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHistoryPage((prev) =>
                            Math.min(prev + 1, totalHistoryPages),
                          )
                        }
                        disabled={historyPage === totalHistoryPages}
                        className="h-8 px-3 rounded-xl font-bold text-xs"
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
