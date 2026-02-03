import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { statisticsApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  TrendingUp,
  UtensilsCrossed,
  Lock,
  Unlock,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => statisticsApi.getDashboard(),
  });

  const stats = data?.data.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-4xl animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <LayoutDashboard className="text-orange-500" />
        Dashboard
      </h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Đơn hôm nay
            </CardTitle>
            <ShoppingCart className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.todayOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Chờ xác nhận mua gói
            </CardTitle>
            <Package className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats?.pendingPurchaseRequests || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Doanh thu tháng
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatVND(stats?.monthlyRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Menu hôm nay
            </CardTitle>
            <UtensilsCrossed className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.todayMenuExists ? (
                <>
                  {stats?.todayMenuLocked ? (
                    <Lock className="w-5 h-5 text-red-500" />
                  ) : (
                    <Unlock className="w-5 h-5 text-green-500" />
                  )}
                  <span>{stats?.todayMenuLocked ? "Đã khóa" : "Đang mở"}</span>
                </>
              ) : (
                <span className="text-gray-500">Chưa tạo</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/admin/menus">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
              >
                <UtensilsCrossed className="w-6 h-6" />
                <span>Tạo menu hôm nay</span>
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
              >
                <ShoppingCart className="w-6 h-6" />
                <span>Xem đơn đặt cơm</span>
              </Button>
            </Link>
            <Link to="/admin/packages">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col gap-2"
              >
                <Package className="w-6 h-6" />
                <span>Quản lý gói</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pending Purchase Requests Alert */}
      {(stats?.pendingPurchaseRequests || 0) > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-medium">
                    Có {stats?.pendingPurchaseRequests} yêu cầu mua gói đang chờ
                  </p>
                  <p className="text-sm text-gray-600">
                    Vui lòng kiểm tra và xác nhận thanh toán
                  </p>
                </div>
              </div>
              <Link to="/admin/packages">
                <Button className="gap-2">
                  Xem ngay <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
