import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { formatDate } from "@/lib/utils";
import {
  History,
  UtensilsCrossed,
  CheckCircle2,
  Clock,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types";

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  // Date filter state
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<"day" | "all">("day");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => ordersApi.getMyOrders(),
  });

  useEffect(() => {
    if (!socket) return;
    const handleOrderConfirmed = () => {
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
    };
    socket.on("order_confirmed", handleOrderConfirmed);
    return () => {
      socket.off("order_confirmed", handleOrderConfirmed);
    };
  }, [socket, queryClient]);

  const allOrders = data?.data.data || [];

  // Filter orders by selected date
  const filteredOrders = useMemo(() => {
    if (viewMode === "all") return allOrders;
    return allOrders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      return orderDate === selectedDate;
    });
  }, [allOrders, selectedDate, viewMode]);

  // Get unique dates that have orders (for quick navigation)
  const orderDates = useMemo(() => {
    const dates = new Set<string>();
    allOrders.forEach((order) => {
      if (order.createdAt) {
        dates.add(new Date(order.createdAt).toISOString().split("T")[0]);
      }
    });
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [allOrders]);

  // Stats
  const stats = useMemo(() => {
    const confirmed = filteredOrders.filter((o) => o.isConfirmed).length;
    const pending = filteredOrders.filter((o) => !o.isConfirmed).length;
    const totalItems = filteredOrders.reduce(
      (sum, o) =>
        sum +
        (o.orderItems?.reduce(
          (itemSum: number, item: any) => itemSum + (item.quantity || 1),
          0,
        ) || 0),
      0,
    );
    return { total: filteredOrders.length, confirmed, pending, totalItems };
  }, [filteredOrders]);

  const navigateDate = (direction: "prev" | "next") => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const todayDate = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (dateStr === todayDate) return "Hôm nay";
    if (dateStr === yesterdayStr) return "Hôm qua";

    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Đang tải lịch sử...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-orange-500 font-bold text-xs uppercase tracking-widest mb-1">
            Lịch sử
          </p>
          <h1 className="text-2xl font-black text-gray-900">Lịch sử đặt cơm</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-10 w-10 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* View Mode Toggle + Date Picker */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Toggle */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setViewMode("day")}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
              viewMode === "day"
                ? "text-orange-600 bg-orange-50 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Calendar size={14} className="inline mr-2" />
            Xem theo ngày
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${
              viewMode === "all"
                ? "text-orange-600 bg-orange-50 border-b-2 border-orange-500"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <History size={14} className="inline mr-2" />
            Xem tất cả
          </button>
        </div>

        {/* Date Navigation */}
        {viewMode === "day" && (
          <div className="px-5 py-4 flex items-center justify-between gap-4 bg-gray-50">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate("prev")}
              className="h-9 w-9 rounded-lg shrink-0"
            >
              <ChevronLeft size={18} />
            </Button>

            <div className="flex items-center gap-3 flex-1 justify-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
              />
              <span className="text-sm font-bold text-gray-700 hidden sm:block">
                {formatDateLabel(selectedDate)}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate("next")}
              disabled={selectedDate >= today}
              className="h-9 w-9 rounded-lg shrink-0"
            >
              <ChevronRight size={18} />
            </Button>

            {selectedDate !== today && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(today)}
                className="text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-lg shrink-0"
              >
                Hôm nay
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Tổng đơn",
            value: stats.total,
            icon: Package,
            color: "orange",
          },
          {
            label: "Đã xác nhận",
            value: stats.confirmed,
            icon: CheckCircle2,
            color: "emerald",
          },
          {
            label: "Chờ xác nhận",
            value: stats.pending,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Tổng món",
            value: stats.totalItems,
            icon: UtensilsCrossed,
            color: "blue",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl bg-white border border-gray-100 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center`}
            >
              <stat.icon size={18} className={`text-${stat.color}-500`} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
              <p className="text-[11px] text-gray-400 font-medium">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Date Chips */}
      {viewMode === "day" && orderDates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {orderDates.slice(0, 10).map((date) => (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDate === date
                  ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              {formatDateLabel(date)}
            </button>
          ))}
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="text-center py-14">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed size={28} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {viewMode === "day"
                ? "Không có đơn nào trong ngày này"
                : "Chưa có đơn đặt cơm nào"}
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              {viewMode === "day"
                ? "Chọn ngày khác hoặc đặt cơm ngay!"
                : "Hãy đặt cơm để bắt đầu!"}
            </p>
            <Link to="/order">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold gap-2">
                <UtensilsCrossed size={16} />
                Đặt cơm ngay
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden"
            >
              {/* Order header */}
              <div className="px-5 py-3.5 flex items-center justify-between bg-gray-50/50 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      order.isConfirmed ? "bg-emerald-100" : "bg-amber-100"
                    }`}
                  >
                    {order.isConfirmed ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <Clock size={16} className="text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                      {(order as any).menuIndex && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-black tracking-wider">
                          Menu {(order as any).menuIndex}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {order.orderItems?.length || 0} món đã đặt
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                    order.isConfirmed
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}
                >
                  {order.isConfirmed ? "✅ Đã xác nhận" : "⏳ Chờ xác nhận"}
                </span>
              </div>

              {/* Order items */}
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {order.orderItems?.map((item) => {
                    const menuItem = item.menuItemId as MenuItem;
                    return (
                      <span
                        key={item._id}
                        className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold border border-orange-100"
                      >
                        {menuItem?.name || "Món ăn"}
                        {(item as any).quantity && (item as any).quantity > 1 && (
                          <span className="text-orange-500"> ×{(item as any).quantity}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {viewMode === "all" && allOrders.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-2">
          Tổng cộng {allOrders.length} đơn đặt cơm
        </div>
      )}
    </div>
  );
}
