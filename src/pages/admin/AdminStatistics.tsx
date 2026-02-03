import { useQuery } from "@tanstack/react-query";
import { statisticsApi } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  UtensilsCrossed,
  Calendar,
  Clock,
} from "lucide-react";

export default function AdminStatistics() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => statisticsApi.getDashboard(),
  });

  const dashboard = dashboardData?.data.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">📊</div>
          <p className="text-gray-500">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Người dùng",
      value: dashboard?.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      title: "Gói đang hoạt động",
      value: dashboard?.activePackages || 0,
      icon: Package,
      color: "text-green-500",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      title: "Đơn hôm nay",
      value: dashboard?.todayOrders || 0,
      icon: UtensilsCrossed,
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      title: "Menu hôm nay",
      value: dashboard?.todayMenus || 0,
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="text-orange-500" />
        Thống kê tổng quan
      </h1>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`${stat.border} hover:shadow-md transition-shadow`}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Pending */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="text-green-500 w-5 h-5" />
              Doanh thu tháng này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-green-600">
                {(dashboard?.monthlyRevenue || 0).toLocaleString("vi-VN")}
                <span className="text-lg font-normal text-gray-500">đ</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">Từ đầu tháng đến nay</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="text-yellow-500 w-5 h-5" />
              Yêu cầu chờ duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-yellow-600">
                {dashboard?.pendingPurchaseRequests || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Yêu cầu mua gói đang chờ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="text-orange-500" />
            Top món ăn trong tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard?.topItems && dashboard.topItems.length > 0 ? (
            <div className="space-y-3">
              {dashboard.topItems.map(
                (item: { name: string; count: number }, index: number) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent rounded-xl border border-orange-100"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-amber-600"
                                : "bg-orange-400"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="font-medium text-lg">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-orange-500">
                        {item.count}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">lượt</span>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Chưa có dữ liệu đặt món trong tháng này</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
