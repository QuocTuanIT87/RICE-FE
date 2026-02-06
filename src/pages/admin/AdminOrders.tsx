import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import {
  ClipboardList,
  Check,
  Copy,
  Calendar,
  Users,
  Utensils,
  Clock,
  CheckCircle2,
  Mail,
  User as UserIcon,
  Hash,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import type { User, MenuItem } from "@/types";
import { useSocket } from "@/contexts/SocketContext";
import { Badge } from "@/components/ui/badge";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { socket } = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ["adminOrders", selectedDate],
    queryFn: () => ordersApi.getOrdersByDate(selectedDate),
  });

  const menu = data?.data.data?.menu;
  const orders = data?.data.data?.orders || [];
  const summary = data?.data.data?.summary || [];

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
      socket.off("order_created");
      socket.off("order_updated");
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Đơn hàng
            </h1>
            {menu && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black text-[10px] px-2 h-5 rounded uppercase">
                {formatDate(selectedDate)}
              </Badge>
            )}
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Theo dõi và xác nhận các suất ăn thượng đế đã đặt.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 pl-11 pr-4 border border-gray-100 rounded-lg text-sm font-bold focus:ring-1 focus:ring-orange-500 bg-white"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
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
                  label: "Chờ xác nhận",
                  val: stats.pending,
                  icon: Clock,
                  color: stats.pending > 0 ? "orange" : "gray",
                },
                {
                  label: "Đã xác nhận",
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
                Xác nhận tất cả
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
                              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100 group-hover:bg-orange-50 transition-colors">
                                <UserIcon
                                  className="text-gray-300 group-hover:text-orange-500"
                                  size={20}
                                />
                              </div>
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

                            <div className="flex-1 flex flex-wrap gap-1.5 md:justify-center">
                              {order.orderItems?.map((item: any) => (
                                <Badge
                                  key={item._id}
                                  variant="secondary"
                                  className="bg-orange-50 text-orange-700 hover:bg-orange-100 border-none font-bold text-[10px] px-2.5 py-0.5 rounded-lg uppercase"
                                >
                                  {(item.menuItemId as MenuItem)?.name ||
                                    "Món đã xóa"}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center md:items-end flex-col gap-1 shrink-0">
                              <Badge
                                className={`font-black text-[9px] px-2 py-0.5 rounded-md border-none uppercase ${order.isConfirmed ? "bg-emerald-50 text-emerald-600" : "bg-orange-100 text-orange-700"}`}
                              >
                                {order.isConfirmed
                                  ? "ĐÃ XÁC NHẬN"
                                  : "CHỜ DUYỆT"}
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
                    Hãy xác nhận tất cả đơn trước khi thực hiện "Copy danh sách"
                    để chốt số lượng với nhà bếp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
