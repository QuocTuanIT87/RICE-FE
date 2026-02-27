import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/services/api";
import { useSocket } from "@/contexts/SocketContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  History,
  UtensilsCrossed,
  Check,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types";

export default function OrderHistoryPage() {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => ordersApi.getMyOrders(),
  });

  // Real-time: listen khi admin xác nhận đơn
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

  const orders = data?.data.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📋</div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <History className="text-orange-500" />
          Lịch sử đặt cơm
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 w-9 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">
              Chưa có đơn đặt cơm nào
            </h2>
            <p className="text-gray-500 mb-4">
              Hãy đặt cơm để bắt đầu tích lũy lịch sử!
            </p>
            <Link to="/order">
              <Button className="gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                Đặt cơm ngay
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {order.createdAt ? formatDate(order.createdAt) : "N/A"}
                  </CardTitle>
                  <span
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                      order.isConfirmed
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.isConfirmed ? (
                      <>
                        <Check className="w-3 h-3" /> Đã xác nhận
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" /> Chờ xác nhận
                      </>
                    )}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {order.orderItems?.map((item) => {
                    const menuItem = item.menuItemId as MenuItem;
                    return (
                      <span
                        key={item._id}
                        className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                      >
                        {menuItem?.name || "Món ăn"}
                      </span>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {order.orderItems?.length || 0} món
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
