import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "@/hooks/useToast";
import { cn, formatDate, formatVND } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ordersApi } from "@/services/api";
import type { MenuItem, User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Hash,
  Mail,
  RefreshCw,
  User as UserIcon,
  Users,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Pagination } from "@/components/Pagination";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [page, setPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<string | undefined>();
  const { socket } = useSocket();
  const { config: systemConfig } = useAppSelector((state) => state.system);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"orders" | "settlement">("orders");
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);

  const { data: unsettledData, isLoading: isUnsettledLoading, refetch: refetchUnsettled } = useQuery({
    queryKey: ["unsettledSummary"],
    queryFn: () => ordersApi.getUnsettledSummary(),
    enabled: activeTab === "settlement",
  });

  const unsettledSummary = unsettledData?.data.data?.summary || [];
  const restaurantBank = unsettledData?.data.data?.restaurantBank || {
    restaurantBankId: "MB",
    restaurantBankAccountNo: "",
    restaurantBankAccountName: "",
  };

  const settleOrdersMutation = useMutation({
    mutationFn: (orderIds: string[]) => ordersApi.settleOrders(orderIds),
    onSuccess: () => {
      toast({
        title: "Tất toán thành công!",
        description: "Đã đánh dấu các đơn hàng là đã tất toán với quán cơm.",
        variant: "success",
      });
      setSelectedMenuIds([]);
      queryClient.invalidateQueries({ queryKey: ["unsettledSummary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tất toán công nợ",
        description: error?.response?.data?.message || "Đã xảy ra lỗi không xác định.",
        variant: "destructive",
      });
    },
  });

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Đã sao chép!" });
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["adminOrders", selectedDate, page, activeMenuId],
    queryFn: () =>
      ordersApi.getOrdersByDate(selectedDate, page, 4, activeMenuId),
  });

  const menus = data?.data.data?.menus || [];
  const menu = data?.data.data?.menu;
  const ordersResponse = data?.data.data?.orders;
  const orders = ordersResponse?.docs || [];
  const summary = data?.data.data?.summary || [];
  const totalNormalMeals = data?.data.data?.totalNormalMeals || 0;
  const totalNoRiceMeals = data?.data.data?.totalNoRiceMeals || 0;
  const totalAmount = data?.data.data?.totalAmount || 0;

  const restaurantBankId = systemConfig?.restaurantBankId || "MB";
  const restaurantBankAccountNo =
    systemConfig?.restaurantBankAccountNo || "0888888888";
  const restaurantBankAccountName =
    systemConfig?.restaurantBankAccountName || "CHU QUAN COM";

  const transferContent = menu
    ? `QUOC TUAN TRA TIEN COM NGAY ${selectedDate}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toUpperCase()
    : "";

  const qrCodeUrl =
    totalAmount > 0
      ? `https://img.vietqr.io/image/${restaurantBankId}-${restaurantBankAccountNo}-compact.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(restaurantBankAccountName)}`
      : "";

  // Reset về trang 1 khi đổi ngày
  useEffect(() => {
    setPage(1);
    setActiveMenuId(undefined);
  }, [selectedDate]);

  // Real-time listener
  useEffect(() => {
    if (!socket) return;
    const handleOrderUpdate = (data: { menuId: string }) => {
      if (menu && data.menuId === menu._id) {
        queryClient.invalidateQueries({
          queryKey: ["adminOrders", selectedDate],
        });
        toast({
          title: "Đơn hàng mới!",
          description: "Vừa có khách đặt/sửa đơn cơm.",
          variant: "default",
        });
      }
    };
    socket.on("order_created", handleOrderUpdate);
    socket.on("order_updated", handleOrderUpdate);
    return () => {
      socket.off("order_created", handleOrderUpdate);
      socket.off("order_updated", handleOrderUpdate);
    };
  }, [socket, menu, selectedDate, queryClient]);

  const confirmMutation = useMutation({
    mutationFn: (menuId: string) => ordersApi.confirmAllOrders(menuId),
    onSuccess: (res) => {
      toast({
        title: "Thành công",
        description: `Đã xác nhận ${res.data.data?.confirmedCount} đơn hàng`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      setIsQrModalOpen(true);
    },
  });

  const copyMutation = useMutation({
    mutationFn: (menuId: string) => ordersApi.getCopyText(menuId),
    onSuccess: (res) => {
      navigator.clipboard.writeText(res.data.data?.copyText || "");
      toast({ title: "Đã copy danh sách đặt cơm!", variant: "success" });
    },
  });

  const stats = useMemo(
    () => ({
      total: orders.length,
      confirmed: orders.filter((o: any) => o.isConfirmed).length,
      pending: orders.filter((o: any) => !o.isConfirmed).length,
      menuItems: summary.length,
    }),
    [orders, summary],
  );

  const selectedSettlementDetails = useMemo(() => {
    let totalOrdersCount = 0;
    let totalMealsCount = 0;
    let totalAmount = 0;
    const orderIds: string[] = [];
    const itemsDetail: { [name: string]: number } = {};

    selectedMenuIds.forEach((menuId) => {
      const group = unsettledSummary.find((g) => g.menuId === menuId);
      if (group) {
        totalOrdersCount += group.totalOrdersCount;
        totalMealsCount += group.totalMealsCount || 0;
        totalAmount += group.totalAmount;
        orderIds.push(...group.orderIds);

        Object.values(group.itemsDetail).forEach((item) => {
          if (!itemsDetail[item.name]) {
            itemsDetail[item.name] = 0;
          }
          itemsDetail[item.name] += item.quantity;
        });
      }
    });

    return {
      totalOrdersCount,
      totalMealsCount,
      totalAmount,
      orderIds,
      itemsDetail,
    };
  }, [selectedMenuIds, unsettledSummary]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-600 rounded-xl shadow-lg shadow-orange-100 text-white">
              <ClipboardList size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">
              {activeTab === "orders" ? "Đơn đặt cơm" : "Đối soát công nợ"}
            </h1>
            {activeTab === "orders" && menu && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black text-[10px] px-2 h-5 rounded uppercase">
                {formatDate(selectedDate)}
              </Badge>
            )}
          </div>
          <p className="text-gray-500 font-medium text-sm">
            {activeTab === "orders"
              ? "Theo dõi và xác nhận các suất ăn thượng đế đã đặt."
              : "Tổng hợp và thanh toán công nợ tích lũy cho chủ quán cơm."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "orders" ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                className="h-10 w-10 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
              >
                <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
              </Button>
              <div className="relative group">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 pl-11 pr-4 border border-gray-100 rounded-lg text-sm font-bold focus:ring-1 focus:ring-orange-500 bg-white"
                />
              </div>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchUnsettled()}
              disabled={isUnsettledLoading}
              className="h-10 w-10 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
            >
              <RefreshCw size={16} className={isUnsettledLoading ? "animate-spin" : ""} />
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1.5 bg-gray-50 p-1.5 rounded-2xl w-max border border-gray-100 shadow-sm animate-in fade-in">
        <button
          onClick={() => setActiveTab("orders")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 tracking-wider",
            activeTab === "orders"
              ? "bg-white text-orange-600 shadow-sm border border-orange-100/50"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          <ClipboardList size={14} />
          Theo dõi đơn hàng
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className={cn(
            "px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 tracking-wider",
            activeTab === "settlement"
              ? "bg-white text-orange-600 shadow-sm border border-orange-100/50"
              : "text-gray-400 hover:text-gray-600",
          )}
        >
          <Hash size={14} />
          Công nợ quán cơm
        </button>
      </div>

      {/* Menu Switcher */}
      {menus.length > 1 && (
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-max border border-gray-100 animate-in fade-in">
          {menus.map((m, index) => {
            const isActive =
              activeMenuId === m._id || (!activeMenuId && menu?._id === m._id);
            return (
              <button
                key={m._id}
                onClick={() => {
                  setActiveMenuId(m._id);
                  setPage(1);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  isActive
                    ? "bg-white text-orange-600 shadow-sm border border-orange-100"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                Menu {index + 1}
              </button>
            );
          })}
        </div>
      )}

      {activeTab === "orders" ? (
        isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : !menu ? (
          <div className="py-32 text-center bg-gray-50/30 border border-dashed rounded-2xl border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-gray-300" size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 uppercase">
              Trống lịch đặt cơm
            </h2>
            <p className="text-gray-400 font-medium mt-1">
              Không có thực đơn nào được thiết lập cho ngày{" "}
              {formatDate(selectedDate)}
            </p>
          </div>
        ) : (
          <>
          {/* Stats & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Tổng số đơn",
                  val: stats.total,
                  icon: ClipboardList,
                  color: "gray",
                },
                {
                  label: "Chưa thanh toán",
                  val: stats.pending,
                  icon: Clock,
                  color: stats.pending > 0 ? "orange" : "gray",
                },
                {
                  label: "Đã thanh toán",
                  val: stats.confirmed,
                  icon: CheckCircle2,
                  color: "emerald",
                },
                {
                  label: "Số loại món",
                  val: stats.menuItems,
                  icon: Utensils,
                  color: "blue",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-lg bg-${s.color}-50 text-${s.color}-600 mb-3`}
                  >
                    <s.icon size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 leading-none mt-1">
                    {s.val}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => confirmMutation.mutate(menu._id)}
                disabled={confirmMutation.isPending || orders.length === 0}
                className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-2 font-black transition-all shadow-lg shadow-orange-100 uppercase text-xs"
              >
                <Check className="w-4 h-4" />
                Chốt & Khóa thực đơn
              </Button>
              <Button
                variant="outline"
                onClick={() => copyMutation.mutate(menu._id)}
                disabled={copyMutation.isPending}
                className="h-12 border-gray-200 rounded-xl gap-2 font-black text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all uppercase text-xs"
              >
                <Copy className="w-4 h-4" />
                Copy danh sách
              </Button>
              {menu.isLocked && totalAmount > 0 && (
                <Button
                  onClick={() => setIsQrModalOpen(true)}
                  className="h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-2 font-black transition-all shadow-lg shadow-orange-100 uppercase text-xs animate-in fade-in duration-300"
                >
                  <span>💸</span>
                  Thanh toán chủ quán
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            {/* Orders Details */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Users size={14} /> Danh sách thực tế
              </h2>

              <div className="space-y-3">
                {orders.length === 0 ? (
                  <div className="p-12 text-center bg-gray-50/30 border border-dashed rounded-xl border-gray-200">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                      Chưa có người đặt cơm
                    </p>
                  </div>
                ) : (
                  orders.map((order: any) => {
                    const user = order.userId as User;
                    return (
                      <Card
                        key={order._id}
                        className="border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:border-orange-200 transition-all group bg-white"
                      >
                        <CardContent className="p-0">
                          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-gray-100"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-orange-50 transition-colors">
                                  <UserIcon
                                    className="text-gray-300 group-hover:text-orange-500"
                                    size={20}
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 uppercase tracking-tight truncate">
                                  {user.name}
                                </p>
                                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Mail size={10} /> {user.email}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={10} />{" "}
                                    {formatDate(order.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col gap-1.5 md:px-4">
                              {order.orderItems?.map((item: any) => {
                                const menuItem = item.menuItemId as MenuItem;
                                return (
                                  <div
                                    key={item._id}
                                    className="flex items-start gap-2"
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-lg uppercase shrink-0"
                                    >
                                      {menuItem?.name || "Món đã xóa"}
                                    </Badge>
                                    {item.quantity && item.quantity > 1 && (
                                      <Badge className="bg-orange-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded-md shrink-0">
                                        ×{item.quantity}
                                      </Badge>
                                    )}
                                    {item.note && item.note.trim() && (
                                      <span className="text-[10px] text-gray-400 italic truncate">
                                        📝 {item.note}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex items-center md:items-end flex-col gap-1 shrink-0">
                              <Badge
                                className={`font-black text-[9px] px-2 py-0.5 rounded-md border-none uppercase ${order.isConfirmed ? "bg-emerald-50 text-emerald-600" : "bg-orange-100 text-orange-700"}`}
                              >
                                {order.isConfirmed
                                  ? "ĐÃ THANH TOÁN"
                                  : "CHƯA THANH TOÁN"}
                              </Badge>
                              <p className="text-[10px] font-black text-gray-300">
                                ID: #
                                {order._id
                                  .substring(order._id.length - 4)
                                  .toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {ordersResponse && (
                <Pagination
                  currentPage={ordersResponse.page}
                  totalPages={ordersResponse.pages}
                  onPageChange={setPage}
                  className="mt-6"
                />
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Hash size={14} /> Bảng tổng hợp món ăn
              </h2>

              <Card className="border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-6 space-y-4">
                  {summary.length === 0 ? (
                    <p className="text-xs font-bold text-gray-300 uppercase py-6 text-center">
                      Trống
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {summary.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-gray-50/50 rounded-xl border border-gray-100/50 group hover:bg-orange-50/50 hover:border-orange-100 transition-all"
                        >
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-600 text-white font-black text-xs px-2.5 h-6 rounded-lg shadow-sm shadow-orange-100">
                              x{item.count}
                            </Badge>
                            <ChevronRight
                              size={14}
                              className="text-gray-300 group-hover:text-orange-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="h-px bg-gray-100" />

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2
                      className="text-emerald-500 shrink-0"
                      size={20}
                    />
                    <p className="text-[11px] text-emerald-700 font-bold leading-relaxed italic">
                      Tất cả dữ liệu đã được tổng hợp chính xác theo thời gian
                      thực.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-4">
                <AlertCircle className="text-orange-500 shrink-0" size={20} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black text-orange-900 uppercase tracking-widest">
                    Lưu ý nghiệp vụ
                  </h4>
                  <p className="text-[11px] text-orange-700/70 leading-relaxed font-bold italic">
                    Hãy ấn nút "Chốt & Khóa thực đơn" để đóng lịch đặt cơm hôm
                    nay trước khi thực hiện "Copy danh sách" gửi cho nhà bếp.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MODAL QR THANH TOÁN CHỦ QUÁN */}
          <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-3xl border-none bg-white shadow-2xl">
              <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <DialogTitle className="text-lg font-black uppercase tracking-wide flex items-center gap-2 text-white">
                  <span>💸</span>
                  Thanh toán cho chủ quán cơm
                </DialogTitle>
                <DialogDescription className="text-xs text-orange-100 font-medium">
                  Quét mã QR VietQR bên dưới để thanh toán nhanh tiền cơm hôm
                  nay.
                </DialogDescription>
              </DialogHeader>

              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column: QR Image (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-center">
                  {qrCodeUrl ? (
                    <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-2xl border border-gray-100 h-full">
                      <img
                        src={qrCodeUrl}
                        alt="VietQR code thanh toan chu quan"
                        className="w-full max-w-[240px] aspect-square object-contain shadow-md rounded-xl bg-white border border-gray-100/50"
                      />
                      {/* <p className="text-[9px] text-gray-400 font-bold mt-2 uppercase tracking-wider">
                        Powered by VietQR.io
                      </p> */}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-center h-full">
                      ⚠️ Chưa thể tạo mã QR. Vui lòng kiểm tra lại cấu hình tài
                      khoản chủ quán cơm.
                    </div>
                  )}
                </div>

                {/* Right Column: Breakdown & Bank details (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  {/* Order breakdown */}
                  <div className="space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">
                      Chi tiết hóa đơn ({selectedDate})
                    </h4>
                    <div className="space-y-1 text-xs font-bold text-gray-600">
                      <div className="flex justify-between">
                        <span>Suất có cơm (Normal):</span>
                        <span className="text-gray-900">
                          {totalNormalMeals} phần
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Suất không cơm (No-rice):</span>
                        <span className="text-gray-900">
                          {totalNoRiceMeals} phần
                        </span>
                      </div>
                      <div className="h-px bg-gray-200/50 my-1.5" />
                      <div className="flex justify-between text-sm font-black text-orange-600">
                        <span>Tổng thanh toán:</span>
                        <span>{formatVND(totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Restaurant bank info with copy buttons */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-0.5">
                      Tài khoản nhận tiền & Nội dung
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold group">
                        <div className="min-w-0">
                          <span className="text-[9px] text-gray-400 block uppercase font-black">
                            Ngân hàng
                          </span>
                          <span className="text-gray-800 uppercase block truncate">
                            {restaurantBankId}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleCopyText(restaurantBankId, "bankId")
                          }
                          className="h-8 w-8 text-gray-400 hover:text-orange-500 rounded-lg shrink-0 ml-1"
                        >
                          {copiedField === "bankId" ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold group">
                        <div className="min-w-0">
                          <span className="text-[9px] text-gray-400 block uppercase font-black">
                            Chủ tài khoản
                          </span>
                          <span className="text-gray-800 uppercase block truncate">
                            {restaurantBankAccountName}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleCopyText(
                              restaurantBankAccountName,
                              "accountName",
                            )
                          }
                          className="h-8 w-8 text-gray-400 hover:text-orange-500 rounded-lg shrink-0 ml-1"
                        >
                          {copiedField === "accountName" ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold group">
                      <div>
                        <span className="text-[9px] text-gray-400 block uppercase font-black">
                          Số tài khoản
                        </span>
                        <span className="text-gray-800">
                          {restaurantBankAccountNo}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopyText(restaurantBankAccountNo, "accountNo")
                        }
                        className="h-8 w-8 text-gray-400 hover:text-orange-500 rounded-lg shrink-0"
                      >
                        {copiedField === "accountNo" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold group">
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-gray-400 block uppercase font-black">
                          Nội dung chuyển khoản
                        </span>
                        <span className="text-gray-800 select-all block truncate font-mono text-[11px]">
                          {transferContent}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCopyText(transferContent, "transferContent")
                        }
                        className="h-8 w-8 text-gray-400 hover:text-orange-500 rounded-lg shrink-0 ml-1"
                      >
                        {copiedField === "transferContent" ? (
                          <Check size={14} className="text-emerald-500" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100">
                <Button
                  onClick={() => setIsQrModalOpen(false)}
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black shadow-xl shadow-orange-100"
                >
                  ĐÃ HOÀN THÀNH CHUYỂN KHOẢN
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) ) : (
        // Settlement Tab Content
        <div className="animate-in fade-in duration-300">
          {isUnsettledLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
          ) : unsettledSummary.length === 0 ? (
            <div className="py-32 text-center bg-gray-50/30 border border-dashed rounded-2xl border-gray-200">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 uppercase">
                Đã tất toán toàn bộ!
              </h2>
              <p className="text-gray-400 font-medium mt-1">
                Không có công nợ nào chưa tất toán với quán cơm. Đạo hữu thật tuyệt vời!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column - List of unsettled days */}
              <div className="lg:col-span-5 space-y-4">
                <div className="flex justify-between items-center pl-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Các ngày chưa thanh toán ({unsettledSummary.length})
                  </span>
                  {selectedMenuIds.length > 0 && (
                    <button
                      onClick={() => setSelectedMenuIds([])}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700"
                    >
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {unsettledSummary.map((item) => {
                    const isSelected = selectedMenuIds.includes(item.menuId);
                    return (
                      <div
                        key={item.menuId}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMenuIds(selectedMenuIds.filter((id) => id !== item.menuId));
                          } else {
                            setSelectedMenuIds([...selectedMenuIds, item.menuId]);
                          }
                        }}
                        className={cn(
                          "p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 cursor-pointer transition-all flex items-start gap-4 select-none",
                          isSelected && "border-orange-500 bg-orange-50/10 shadow-md",
                        )}
                      >
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-4.5 w-4.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-sm font-black text-gray-800">
                              {formatDate(item.menuDate.split("T")[0])}
                            </span>
                            <span className="text-sm font-black text-orange-600">
                              {formatVND(item.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {item.totalOrdersCount} đơn ({item.totalMealsCount || item.totalOrdersCount} suất)
                            </span>
                            <span className="flex items-center gap-1">
                              <Utensils size={12} />
                              {Object.keys(item.itemsDetail).length} loại món
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column - Summary & Action */}
              <div className="lg:col-span-7 space-y-6">
                {selectedMenuIds.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                      <AlertCircle size={24} />
                    </div>
                    <h3 className="font-bold text-gray-800 uppercase text-sm">
                      Chọn ngày để chốt công nợ
                    </h3>
                    <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto leading-relaxed">
                      Vui lòng tích chọn một hoặc nhiều ngày chưa thanh toán ở cột bên trái để bắt đầu lập bảng đối soát.
                    </p>
                  </div>
                ) : (
                  <Card className="border-gray-100 shadow-xl overflow-hidden rounded-3xl">
                    <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-3xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest">
                            Tất toán công nợ
                          </p>
                          <h2 className="text-2xl font-black mt-1">
                            {formatVND(selectedSettlementDetails.totalAmount)}
                          </h2>
                        </div>
                        <Badge className="bg-white/20 text-white border-none font-bold text-[10px] px-2.5 py-1 rounded-full uppercase">
                          {selectedMenuIds.length} ngày đã chọn
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-xs font-bold text-orange-100">
                        <span>
                          Tổng: {selectedSettlementDetails.totalOrdersCount} đơn ({selectedSettlementDetails.totalMealsCount} suất cơm)
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-6">
                      {/* Dish breakdown list */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">
                          Chi tiết các món đã đặt
                        </label>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2.5">
                          {Object.entries(selectedSettlementDetails.itemsDetail).map(([name, qty]) => (
                            <div key={name} className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-700">{name}</span>
                              <span className="font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                                ×{qty}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bank account details and VietQR */}
                      <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">
                          Thanh toán chuyển khoản VietQR
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          {/* VietQR Image */}
                          <div className="flex justify-center">
                            <div className="bg-white p-3 border border-gray-100 shadow-md rounded-2xl">
                              <img
                                src={`https://img.vietqr.io/image/${restaurantBank.restaurantBankId}-${restaurantBank.restaurantBankAccountNo}-compact2.png?amount=${selectedSettlementDetails.totalAmount}&addInfo=${encodeURIComponent(
                                  `TAT TOAN COM DOT ${selectedMenuIds.length} NGAY`,
                                )}&accountName=${encodeURIComponent(restaurantBank.restaurantBankAccountName)}`}
                                alt="VietQR"
                                className="w-48 h-48 object-contain"
                              />
                            </div>
                          </div>

                          {/* Bank details info */}
                          <div className="space-y-3 text-xs">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                              <p className="text-[9px] font-bold text-gray-400 uppercase">Ngân hàng</p>
                              <p className="font-black text-gray-800 mt-0.5">{restaurantBank.restaurantBankId}</p>
                              <button
                                onClick={() => handleCopyText(restaurantBank.restaurantBankId, "bankId")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
                              >
                                {copiedField === "bankId" ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                              <p className="text-[9px] font-bold text-gray-400 uppercase">Số tài khoản</p>
                              <p className="font-black text-gray-800 mt-0.5">{restaurantBank.restaurantBankAccountNo}</p>
                              <button
                                onClick={() => handleCopyText(restaurantBank.restaurantBankAccountNo, "accountNo")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
                              >
                                {copiedField === "accountNo" ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                              <p className="text-[9px] font-bold text-gray-400 uppercase">Chủ tài khoản</p>
                              <p className="font-black text-gray-800 mt-0.5">{restaurantBank.restaurantBankAccountName}</p>
                              <button
                                onClick={() => handleCopyText(restaurantBank.restaurantBankAccountName, "accountName")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
                              >
                                {copiedField === "accountName" ? (
                                  <Check size={12} className="text-emerald-500" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions footer inside card */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const dateRangeText = selectedMenuIds
                              .map((id) => {
                                const group = unsettledSummary.find((g) => g.menuId === id);
                                return group ? formatDate(group.menuDate.split("T")[0]) : "";
                              })
                              .join(", ");
                            const dishLines = Object.entries(selectedSettlementDetails.itemsDetail)
                              .map(([name, qty]) => `- ${name.toLowerCase()}: ${qty} suất`)
                              .join("\n");
                            const msg = `Tổng hợp ${selectedMenuIds.length} ngày: ${dateRangeText}:\n\n${dishLines}\n\n* Tổng suất cơm: ${selectedSettlementDetails.totalMealsCount} suất\n* Tổng tiền thanh toán: ${formatVND(selectedSettlementDetails.totalAmount)}\n\nEm đã chuyển khoản thanh toán. Chị kiểm tra giúp em nhaaa. Em cảm ơn ạ`;
                            handleCopyText(msg, "zaloMessage");
                          }}
                          className="h-11 rounded-xl font-bold border-orange-200 hover:bg-orange-50 hover:text-orange-600 text-orange-600 transition-all text-xs"
                        >
                          {copiedField === "zaloMessage" ? (
                            <Check size={14} className="mr-1.5 text-emerald-500" />
                          ) : (
                            <Copy size={14} className="mr-1.5" />
                          )}
                          Sao chép tin nhắn Zalo
                        </Button>
                        <Button
                          onClick={() => settleOrdersMutation.mutate(selectedSettlementDetails.orderIds)}
                          disabled={settleOrdersMutation.isPending}
                          className="h-11 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black shadow-lg shadow-orange-100 text-xs transition-all uppercase"
                        >
                          {settleOrdersMutation.isPending ? "Đang xử lý..." : "Xác nhận đã thanh toán"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
