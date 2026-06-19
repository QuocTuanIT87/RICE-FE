import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vipPackagesApi, userMembershipsApi, authApi, depositRequestsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatVND, formatDate, cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { swalAlert, swalToast } from "@/utils/swal";
import { Link } from "react-router-dom";
import { Crown, Award, Sparkles, Palette, Coins, ArrowLeft, Copy, Check, Loader2, RefreshCw, Clock, History } from "lucide-react";
import Swal from "sweetalert2";

export default function VipMembershipPage() {
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const { config: systemConfig } = useAppSelector((state) => state.system);

  // Tab & pagination states
  const [activeTab, setActiveTab] = useState("packages");
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  // Transfer modal states
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch active VIP packages
  const { data: vipPackagesData, isLoading: packagesLoading } = useQuery({
    queryKey: ["vipPackages"],
    queryFn: () => vipPackagesApi.getActivePackages(),
  });
  const vipPackages = vipPackagesData?.data.data || [];

  // Fetch fresh profile details
  const { data: profileData, isLoading: profileLoading, refetch: refetchProfile, isFetching: isFetchingProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => authApi.getMe(),
  });
  const freshUser = profileData?.data.data || user;

  // Fetch user requests to filter for VIP requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
    isFetching: isFetchingRequests,
  } = useQuery({
    queryKey: ["myDepositRequests"],
    queryFn: () => depositRequestsApi.getMyRequests(),
  });
  const requests = requestsData?.data.data || [];
  const vipRequests = requests.filter((r) => r.requestType === "buy_membership");
  const pendingRequests = vipRequests.filter((r) => r.status === "pending");

  useEffect(() => {
    setPendingPage(1);
  }, [pendingRequests.length]);

  useEffect(() => {
    setHistoryPage(1);
  }, [vipRequests.length]);

  const handleRefetchAll = () => {
    refetchProfile();
    refetchRequests();
  };

  const buyPackageMutation = useMutation({
    mutationFn: (packageId: string) => userMembershipsApi.buyWithWallet(packageId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["myDepositRequests"] });
      swalAlert({
        title: "👑 Thành công!",
        text: res.data.message || "Bạn đã kích hoạt gói Hội Viên VIP thành công!",
        icon: "success",
      });
    },
    onError: (err: any) => {
      swalAlert({
        title: "❌ Lỗi kích hoạt",
        text: err.response?.data?.error?.message || "Không thể mua gói hội viên, vui lòng kiểm tra lại số dư.",
        icon: "error",
      });
    },
  });

  // Mutation for creating bank transfer request
  const createDepositMutation = useMutation({
    mutationFn: (data: { amount: number; vipPackageId: string }) =>
      depositRequestsApi.createRequest(data.amount, undefined, "buy_membership", data.vipPackageId),
    onSuccess: () => {
      swalAlert({
        title: "⚽ Gửi yêu cầu thành công! SIUUUUU!",
        text: "Yêu cầu mua gói VIP bằng chuyển khoản đã được gửi, vui lòng đợi Admin duyệt!",
        icon: null,
        imageUrl: "/ronaldo_left.png",
        imageWidth: 280,
        imageAlt: "Ronaldo Siuuu",
      });
      setIsTransferOpen(false);
      setSelectedPackage(null);
      queryClient.invalidateQueries({ queryKey: ["myDepositRequests"] });
    },
    onError: (err: any) => {
      swalAlert({
        title: "❌ Lỗi gửi yêu cầu",
        text: err.response?.data?.error?.message || "Không thể tạo yêu cầu chuyển khoản, vui lòng thử lại.",
        icon: "error",
      });
    },
  });

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    swalToast({
      title: `Đã sao chép ${fieldName} vào bộ nhớ tạm.`,
      icon: "success",
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTransferClick = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsTransferOpen(true);
  };

  const isLoading = packagesLoading || profileLoading || requestsLoading;
  const isRefetching = isFetchingProfile || isFetchingRequests;

  // Pagination calculations
  const ITEMS_PER_PAGE = 5;

  const totalPendingPages = Math.ceil(pendingRequests.length / ITEMS_PER_PAGE);
  const pendingStartIndex = (pendingPage - 1) * ITEMS_PER_PAGE;
  const paginatedPendingRequests = pendingRequests.slice(
    pendingStartIndex,
    pendingStartIndex + ITEMS_PER_PAGE,
  );

  const sortedHistoryRequests = [...vipRequests].sort(
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

  // VietQR Configs
  const bankId = systemConfig?.bankId || "MB";
  const bankAccountNo = systemConfig?.bankAccountNo || "0999999999";
  const bankAccountName = systemConfig?.bankAccountName || "NGUYEN VAN A";

  const transferContent = selectedPackage
    ? `${user?.name || ""} MUA GOI VIP ${selectedPackage._id.slice(-6)}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .toUpperCase()
    : "";

  const qrCodeUrl = selectedPackage
    ? `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?amount=${selectedPackage.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankAccountName)}`
    : "";

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header Back Button */}
      <div className="mb-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-orange-500 transition-colors">
          <ArrowLeft size={16} />
          Quay lại Trang chủ
        </Link>
      </div>

      {/* Hero Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-950 mb-2 tracking-tight">
            Gói Hội Viên{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600">
              VIP Độc Quyền
            </span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm">
            Đăng ký gói hội viên tiết kiệm để nhận ưu đãi giảm giá cơm trưa và đặc quyền giao diện premium.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefetchAll}
          disabled={isRefetching}
          className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 shrink-0"
        >
          <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400 font-semibold">Đang tải thông tin gói VIP...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current VIP status card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 shadow-md rounded-3xl overflow-hidden p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600 animate-pulse shrink-0">
                <Crown size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  {freshUser?.hasMembership
                    ? `Đạo hữu đang là Hội Viên VIP [${freshUser.membershipName}] 👑`
                    : "Trở thành Hội Viên VIP ngay hôm nay!"}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {freshUser?.hasMembership
                    ? `Hạn dùng đến ngày ${formatDate(freshUser.membershipExpiresAt!)}. Giảm ngay ${formatVND(freshUser.vipDiscountRate || 0)} tiền mặt trực tiếp cho mỗi phần cơm đặt.`
                    : "Đăng ký các gói hội viên dưới đây để nhận ưu đãi giảm giá cơm mỗi bữa và mở khóa đặc quyền đổi giao diện."}
                </p>
              </div>
            </div>
            {freshUser?.hasMembership && (
              <Link to="/profile">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-200/50 whitespace-nowrap h-12 px-6 border-none">
                  Cá nhân hóa giao diện →
                </Button>
              </Link>
            )}
          </Card>

          {/* Main Operations Block with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-2xl h-11 mb-2">
              <TabsTrigger
                value="packages"
                className="rounded-xl font-bold text-xs md:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm"
              >
                DANH SÁCH GÓI KHẢ DỤNG
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-xl font-bold text-xs md:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm relative"
              >
                ĐANG CHỜ DUYỆT
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white animate-bounce">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-xl font-bold text-xs md:text-sm py-2 data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm"
              >
                LỊCH SỬ MUA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="packages" className="mt-0 space-y-10">
              {/* Benefits Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-2xl border border-gray-150 shadow-sm flex gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <Coins size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">Tiết Kiệm Mỗi Bữa</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Giảm giá trực tiếp 2.000đ hoặc nhiều hơn trên mỗi phần cơm trưa của bạn. Đặt càng nhiều, tiết kiệm càng lớn!
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-150 shadow-sm flex gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <Palette size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">Cá Nhân Hóa Premium</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Đổi chủ đề (Themes: Hoàng Kim, Dark Mode, Sakura) và trang trí khung viền Avatar VIP (Vương miện, Neon, Kim cương).
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-gray-150 shadow-sm flex gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">Đặc Quyền Diễn Đàn</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Avatar hiển thị kèm khung viền VIP và tên màu vàng kim lấp lánh nổi bật trước toàn bộ đồng nghiệp trong công ty.
                    </p>
                  </div>
                </div>
              </div>

              {/* List of packages */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide flex items-center gap-2 pl-1">
                  <Award className="text-amber-500" />
                  Danh sách Gói VIP khả dụng
                </h3>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {vipPackages.map((pkg: any) => (
                    <Card
                      key={pkg._id}
                      className={cn(
                        "border-2 transition-all duration-300 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full relative group hover:shadow-xl hover:-translate-y-1.5",
                        pkg.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
                      )}
                    >
                      {/* Decorative badge */}
                      <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
                        VIP
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xl font-black text-gray-900 group-hover:text-amber-500 transition-colors">
                              {pkg.name}
                            </h4>
                            <p className="text-xs text-gray-400 font-bold mt-1">Hạn sử dụng: {pkg.validDays} ngày</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-orange-600">{formatVND(pkg.price)}</span>
                            </div>
                            <p className="text-xs font-black text-emerald-600 bg-emerald-50 py-1 px-2.5 rounded-lg inline-block">
                              🔥 Tiết kiệm: Giảm {formatVND(pkg.discountAmount)}/phần cơm
                            </p>
                          </div>

                          {/* Features */}
                          <ul className="space-y-2.5 text-xs text-gray-600 pt-2 border-t border-gray-50">
                            {pkg.features.map((feat: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5 font-bold">✓</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-50">
                          <Button
                            onClick={() => {
                              Swal.fire({
                                title: "Mua Gói VIP?",
                                text: `Đạo hữu có chắc chắn muốn đăng ký gói "${pkg.name}" với giá ${formatVND(pkg.price)} từ số dư ví?`,
                                icon: "question",
                                showCancelButton: true,
                                confirmButtonText: "Đồng ý mua",
                                cancelButtonText: "Hủy bỏ",
                                customClass: {
                                  confirmButton: "swal2-confirm swal2-styled",
                                  cancelButton: "swal2-cancel swal2-styled",
                                },
                              }).then((result: any) => {
                                if (result.isConfirmed) {
                                  buyPackageMutation.mutate(pkg._id);
                                }
                              });
                            }}
                            disabled={buyPackageMutation.isPending}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm text-xs h-10"
                          >
                            Mua bằng Ví Tiền
                          </Button>
                          <Button
                            onClick={() => handleTransferClick(pkg)}
                            variant="outline"
                            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs h-10"
                          >
                            Chuyển khoản trực tiếp
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-200 flex items-center gap-2">
                  <Clock size={18} className="text-amber-600" />
                  <h2 className="font-bold text-amber-900 text-sm md:text-base">
                    Yêu cầu mua gói VIP đang chờ xác nhận ({pendingRequests.length})
                  </h2>
                </div>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-16 bg-white p-6">
                    <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-500">
                      <Clock size={28} />
                    </div>
                    <p className="text-gray-500 text-sm font-bold">
                      Không có yêu cầu mua gói VIP nào đang chờ duyệt
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Khi đạo hữu gửi một yêu cầu mua gói VIP mới bằng hình thức chuyển khoản, nó sẽ xuất hiện ở đây để chờ Admin phê duyệt.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 space-y-2 bg-white">
                      {paginatedPendingRequests.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between p-4 bg-white rounded-xl border border-amber-100 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                              <Crown size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {req.vipPackageId?.name || "Gói Hội Viên VIP"}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Giá gói:{" "}
                                <span className="font-bold text-orange-600">
                                  {formatVND(req.amount)}
                                </span>{" "}
                                • Ngày yêu cầu:{" "}
                                <span className="font-medium text-gray-600">
                                  {formatDate(req.requestedAt)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold shrink-0">
                            ⏳ Chờ duyệt
                          </span>
                        </div>
                      ))}
                    </div>

                    {totalPendingPages > 1 && (
                      <div className="flex items-center justify-between px-6 py-3 border-t border-amber-200 bg-amber-50/50">
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
              <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                    <History size={16} />
                  </div>
                  <h2 className="font-bold text-gray-900">Lịch sử yêu cầu mua gói VIP</h2>
                  <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                    {vipRequests.length}
                  </span>
                </div>

                {vipRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                      <History size={28} />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">
                      Đạo hữu chưa có yêu cầu mua gói VIP nào
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
                              Gói hội viên
                            </th>
                            <th className="text-right px-5 py-3 font-bold text-gray-500 text-xs uppercase tracking-wider">
                              Giá gói
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
                                  <div>{req.vipPackageId?.name || "Gói Hội Viên VIP"}</div>
                                  <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Mã gói: {typeof req.vipPackageId === "object" ? req.vipPackageId?._id?.slice(-6) : (req.vipPackageId || "").slice(-6)}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-right font-black text-amber-600 text-sm">
                                  {formatVND(req.amount)}
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
                            vipRequests.length,
                          )}{" "}
                          trong tổng số {vipRequests.length} giao dịch
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
                                  ? "bg-amber-500 text-white border-none hover:bg-amber-600 shadow-sm"
                                  : "text-gray-600 hover:text-amber-500 hover:bg-amber-50",
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
      )}

      {/* Transfer Information Modal */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
              👑 Chuyển khoản mua gói VIP
            </DialogTitle>
            <DialogDescription>
              Vui lòng chuyển khoản đúng số tiền của gói để hệ thống kích hoạt tự động sau khi đối soát.
            </DialogDescription>
          </DialogHeader>

          {selectedPackage && (
            <div className="space-y-4 py-2">
              {/* QR Code section */}
              <div className="flex flex-col items-center p-4 bg-amber-50/40 rounded-2xl border border-amber-100/50">
                <p className="text-xs font-bold text-amber-800 mb-3 uppercase tracking-wide">
                  Quét mã QR VietQR để thanh toán nhanh
                </p>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-100">
                  <img
                    src={qrCodeUrl}
                    alt="VietQR code"
                    className="w-44 h-44 mx-auto"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center leading-relaxed">
                  Ứng dụng ngân hàng sẽ tự điền Số tài khoản, Số tiền và Nội dung chuyển khoản sau khi quét mã QR này.
                </p>
              </div>

              {/* Account Details details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">Ngân hàng:</span>
                  <span className="font-bold text-gray-900">{bankId}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <span>{bankAccountNo}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccountNo, "Số tài khoản")}
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

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">Chủ tài khoản:</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 uppercase">
                    <span>{bankAccountName}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccountName, "Chủ tài khoản")}
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

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">Số tiền nạp:</span>
                  <span className="font-black text-orange-600">{formatVND(selectedPackage.price)}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 font-medium">Nội dung chuyển khoản:</span>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    <span className="font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] font-black uppercase">
                      {transferContent}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent, "Nội dung")}
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

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              className="rounded-xl border-gray-200 text-gray-500 font-bold"
            >
              Quay lại
            </Button>
            <Button
              onClick={() => {
                if (selectedPackage) {
                  createDepositMutation.mutate({
                    amount: selectedPackage.price,
                    vipPackageId: selectedPackage._id,
                  });
                }
              }}
              disabled={createDepositMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl gap-1.5"
            >
              {createDepositMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Tôi đã hoàn tất chuyển khoản"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

