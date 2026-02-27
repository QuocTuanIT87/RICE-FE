import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { statisticsApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Clock,
  ChevronRight,
  Activity,
  Zap,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => statisticsApi.getDashboard(),
  });

  const stats = data?.data.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl shadow-lg shadow-orange-100 text-white">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Dashboard
            </h1>
          </div>
          <p className="text-gray-500 font-bold text-sm flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" />
            Hệ thống đang hoạt động ổn định. Chào mừng đạo hữu trở lại.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 w-9 rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-200"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <Badge
            variant="outline"
            className="h-9 px-4 rounded-xl border-gray-200 font-black text-[10px] text-gray-400 uppercase tracking-widest"
          >
            MÁY CHỦ: ONLINE
          </Badge>
          <Badge className="h-9 px-4 rounded-xl bg-orange-50 text-orange-600 border-none font-black text-[10px] uppercase tracking-widest">
            V_4.0 PREMIUM
          </Badge>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Đơn cơm hôm nay",
            val: stats?.todayOrders || 0,
            icon: ShoppingCart,
            color: "orange",
            desc: "Tổng suất ăn khách đã đặt",
          },
          {
            label: "Yêu cầu mua gói",
            val: stats?.pendingPurchaseRequests || 0,
            icon: Package,
            color: (stats?.pendingPurchaseRequests || 0) > 0 ? "rose" : "gray",
            desc: "Khách đang chờ duyệt thanh toán",
            accent: (stats?.pendingPurchaseRequests || 0) > 0,
          },
          {
            label: "Doanh thu tháng",
            val: formatVND(stats?.monthlyRevenue || 0),
            icon: TrendingUp,
            color: "emerald",
            desc: "Tổng tiền từ các gói cơm",
          },
          {
            label: "Trạng thái Menu",
            val: stats?.todayMenuExists
              ? stats?.todayMenuLocked
                ? "Khóa"
                : "Mở"
              : "Chưa tạo",
            icon: stats?.todayMenuLocked ? Lock : Unlock,
            color: !stats?.todayMenuExists
              ? "gray"
              : stats?.todayMenuLocked
                ? "rose"
                : "emerald",
            desc: stats?.todayMenuExists
              ? "Menu hiện tại của ngày"
              : "Cần thiết lập menu ngay",
          },
        ].map((s, i) => (
          <Card
            key={i}
            className={`border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-xl hover:shadow-gray-100 transition-all duration-500 bg-white border border-gray-50`}
          >
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-between items-start">
                <div
                  className={`w-14 h-14 flex items-center justify-center rounded-2xl bg-${s.color}-50 text-${s.color}-600 group-hover:bg-${s.color}-600 group-hover:text-white transition-all duration-500 shadow-sm shadow-${s.color}-100`}
                >
                  <s.icon size={24} strokeWidth={2.5} />
                </div>
                {s.accent && (
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {s.label}
                </p>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight transition-all truncate">
                  {s.val}
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 font-bold italic leading-relaxed pt-2 border-t border-gray-50 uppercase tracking-tighter">
                {s.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-3">
            <Zap size={16} className="text-orange-500" /> Thao tác quản trị cấp
            tốc
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                to: "/admin/menus",
                label: "Quản lý Menu",
                icon: UtensilsCrossed,
                color: "orange",
                desc: "Soạn & Duyệt thực đơn",
              },
              {
                to: "/admin/orders",
                label: "Quản lý Đơn",
                icon: ShoppingCart,
                color: "emerald",
                desc: "Chốt số lượng suất ăn",
              },
              {
                to: "/admin/packages",
                label: "Quản lý Gói",
                icon: Package,
                color: "blue",
                desc: "Cấu hình gói linh hoạt",
              },
            ].map((action, i) => (
              <Link key={i} to={action.to} className="group">
                <Card className="border border-gray-100 shadow-sm rounded-3xl hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50 transition-all duration-300 overflow-hidden bg-white h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div
                      className={`w-16 h-16 rounded-[1.25rem] bg-${action.color}-50 flex items-center justify-center text-${action.color}-600 group-hover:scale-110 transition-transform duration-500`}
                    >
                      <action.icon size={28} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-gray-900 uppercase tracking-tight text-sm group-hover:text-orange-600 transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {action.desc}
                      </p>
                    </div>
                    <ChevronRight
                      className="text-gray-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                      size={20}
                    />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Secondary Stats & Notifications */}
        <div className="space-y-6">
          <h2 className="text-sm font-black text-gray-300 uppercase tracking-[0.3em] flex items-center gap-3">
            <Clock size={16} className="text-orange-500" /> Thông tin cần chú ý
          </h2>

          {/* Pending Requests Alert - High End Redesign */}
          {(stats?.pendingPurchaseRequests || 0) > 0 ? (
            <Card className="border-none shadow-xl shadow-rose-100 rounded-[2rem] bg-rose-600 text-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-500 to-rose-700 opacity-90"></div>
              <CardContent className="p-7 relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Package className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-tight text-base leading-none">
                      Cảnh báo thanh toán
                    </p>
                    <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80 underline underline-offset-4 decoration-rose-300">
                      Giao dịch đang chờ
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black leading-relaxed uppercase tracking-wide">
                    Hiện đang có{" "}
                    <span className="text-lg inline-block px-2 bg-white text-rose-600 rounded-md mx-1">
                      {stats?.pendingPurchaseRequests}
                    </span>{" "}
                    thượng đế đang chờ xác nhận mua gói cơm.
                  </p>
                  <Link to="/admin/packages">
                    <Button className="w-full h-12 bg-white text-rose-600 hover:bg-rose-50 rounded-xl font-black text-xs uppercase shadow-lg shadow-rose-900/20 tracking-widest">
                      Xử lý ngay lập tức <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-gray-100 shadow-sm rounded-[2rem] bg-white overflow-hidden border-dashed">
              <CardContent className="p-10 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <p className="font-black text-gray-900 uppercase tracking-tight text-sm">
                  Tuyệt vời!
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Không có yêu cầu mua gói cơm nào đang tồn đọng.
                </p>
              </CardContent>
            </Card>
          )}

          {/* System Info Box */}
          <div className="p-7 bg-white rounded-[2rem] border border-orange-100 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-orange-50 pb-3">
              <Users className="text-orange-500" size={20} />
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                Vai trò quản trị
              </h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-tighter">
                  Tổng quản trị (Super)
                </span>
                <Badge className="bg-orange-50 text-orange-600 font-black text-[9px] border-none px-2 h-5">
                  HỆ THỐNG
                </Badge>
              </div>
              <div className="p-3.5 bg-orange-50 rounded-xl space-y-2">
                <p className="text-[11px] text-orange-700/80 font-bold leading-relaxed italic">
                  Đạo hữu đang truy cập với quyền hạn cao nhất. Hãy cẩn trọng
                  khi thay đổi các cấu hình lượt cơm của khách hàng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
