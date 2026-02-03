import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { ClipboardList, Check, Copy, Calendar } from "lucide-react";
import type { User, MenuItem } from "@/types";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ["adminOrders", selectedDate],
    queryFn: () => ordersApi.getOrdersByDate(selectedDate),
  });

  const confirmMutation = useMutation({
    mutationFn: (menuId: string) => ordersApi.confirmAllOrders(menuId),
    onSuccess: (response) => {
      toast({
        title: "✅ Đã xác nhận tất cả đơn!",
        description: `${response.data.data?.confirmedCount} đơn đã được xác nhận`,
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const copyMutation = useMutation({
    mutationFn: (menuId: string) => ordersApi.getCopyText(menuId),
    onSuccess: (response) => {
      const text = response.data.data?.copyText || "";
      navigator.clipboard.writeText(text);
      toast({ title: "📋 Đã copy danh sách món!", variant: "success" });
    },
    onError: () => toast({ title: "❌ Có lỗi xảy ra", variant: "destructive" }),
  });

  const menu = data?.data.data?.menu;
  const orders = data?.data.data?.orders || [];
  const summary = data?.data.data?.summary || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="text-orange-500" />
          Quản lý đơn đặt cơm
        </h1>

        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-4xl animate-bounce mb-4">📋</div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : !menu ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-semibold mb-2">
              Không có menu cho ngày {formatDate(selectedDate)}
            </h2>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Actions */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Menu ngày {formatDate(menu.menuDate)}
                </p>
                <p className="text-sm text-gray-500">
                  {orders.length} đơn • {menu.beginAt} - {menu.endAt}
                  {menu.isLocked && " • Đã khóa"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyMutation.mutate(menu._id)}
                  disabled={copyMutation.isPending}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy danh sách
                </Button>
                <Button
                  onClick={() => confirmMutation.mutate(menu._id)}
                  disabled={confirmMutation.isPending || orders.length === 0}
                  className="gap-2"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận tất cả
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tổng hợp món ăn</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <p className="text-gray-500">Chưa có đơn đặt nào</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summary.map(
                    (item: { name: string; count: number }, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span>{item.name}</span>
                        <span className="font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">
                          x{item.count}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Orders Detail */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đơn hàng ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-gray-500">Chưa có đơn đặt nào</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const user = order.userId as User;
                    return (
                      <div key={order._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              order.isConfirmed
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {order.isConfirmed ? "Đã xác nhận" : "Chờ xác nhận"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.orderItems?.map((item) => {
                            const menuItem = item.menuItemId as MenuItem;
                            return (
                              <span
                                key={item._id}
                                className="px-2 py-1 bg-gray-100 rounded text-sm"
                              >
                                {menuItem.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
