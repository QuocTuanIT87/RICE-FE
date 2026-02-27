import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { statisticsApi } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  UtensilsCrossed,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  ChevronDown,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminStatistics() {
  const [period, setPeriod] = useState<"day" | "month" | "year">("month");

  const { data: dashboardData, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => statisticsApi.getDashboard(),
  });

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["revenueStats", period],
    queryFn: () => statisticsApi.getRevenue({ period }),
  });

  const dashboard = dashboardData?.data.data;
  const revenue = revenueData?.data.data;

  if (dashLoading || revLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Prepping data for charts
  const revenueChartData =
    revenue?.breakdown.map((item) => ({
      name: item.name,
      value: item.revenue,
      count: item.count,
    })) || [];

  const topItemsData =
    dashboard?.topItems?.map((item) => ({
      name: item.name,
      value: item.count,
    })) || [];

  const COLORS = ["#EA580C", "#F97316", "#FB923C", "#FDBA74", "#FED7AA"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl shadow-lg shadow-orange-100 text-white">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
              Báo cáo chuyên sâu
            </h1>
          </div>
          <p className="text-gray-500 font-bold text-sm">
            Phân tích dữ liệu thực tế để tối ưu hóa vận hành cơm trưa.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[10px] font-black uppercase text-gray-400 px-3">
              Xem theo:
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-32 h-8 font-bold text-xs justify-between group"
                >
                  {period === "day"
                    ? "Hôm nay"
                    : period === "month"
                      ? "Tháng này"
                      : "Năm này"}
                  <ChevronDown
                    size={14}
                    className="text-gray-300 group-hover:text-orange-500"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-xl border-orange-100 font-bold text-xs w-32">
                <DropdownMenuItem
                  onClick={() => setPeriod("day")}
                  className="cursor-pointer"
                >
                  Hôm nay
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPeriod("month")}
                  className="cursor-pointer"
                >
                  Tháng này
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPeriod("year")}
                  className="cursor-pointer"
                >
                  Năm này
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Doanh thu",
            val: formatVND(revenue?.totalRevenue || 0),
            icon: TrendingUp,
            color: "orange",
            trend: "+12%",
            up: true,
          },
          {
            label: "Suất ăn đã bán",
            val: revenue?.totalOrders || 0,
            icon: UtensilsCrossed,
            color: "blue",
            trend: "+5%",
            up: true,
          },
          {
            label: "Gói cơm đã bán",
            val: revenue?.totalPackagesSold || 0,
            icon: Package,
            color: "emerald",
            trend: "+8%",
            up: true,
          },
          {
            label: "Người dùng mới",
            val: dashboard?.totalUsers || 0,
            icon: Users,
            color: "rose",
            trend: "+2%",
            up: true,
          },
        ].map((s, i) => (
          <Card
            key={i}
            className="border-none shadow-sm rounded-3xl bg-white border border-gray-50 overflow-hidden relative group"
          >
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-${s.color}-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`}
            ></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center`}
                >
                  <s.icon size={22} />
                </div>
                <div
                  className={`flex items-center text-[10px] font-black ${s.up ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"} px-2 py-0.5 rounded-full`}
                >
                  {s.up ? (
                    <ArrowUpRight size={10} className="mr-0.5" />
                  ) : (
                    <ArrowDownRight size={10} className="mr-0.5" />
                  )}
                  {s.trend}
                </div>
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {s.label}
              </p>
              <h3 className="text-2xl font-black text-gray-900 mt-1">
                {s.val}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Breakdown Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] bg-white border border-gray-50 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Target size={18} />
              </div>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                Cơ cấu doanh thu theo gói
              </h2>
            </div>
            <Badge className="bg-blue-50 text-blue-600 font-black text-[9px] uppercase tracking-widest px-3 h-6 rounded-lg pointer-events-none">
              PHÂN TÍCH TỶ TRỌNG
            </Badge>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#F1F5F9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  cursor={{ fill: "#F8FAFC" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: "12px" }}
                  labelStyle={{
                    fontWeight: 900,
                    fontSize: "10px",
                    textTransform: "uppercase",
                    color: "#94A3B8",
                    marginBottom: "4px",
                  }}
                  formatter={(value: any) => [
                    formatVND(Number(value)),
                    "Doanh thu",
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {revenueChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Items Pie Chart */}
        <Card className="border border-gray-100 shadow-sm rounded-[2rem] bg-white p-8 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Zap size={18} />
            </div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
              Món ăn yêu thích
            </h2>
          </div>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topItemsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {topItemsData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    padding: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                TOP
              </span>
              <span className="text-2xl font-black text-gray-900">HOT</span>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {topItemsData.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] font-bold"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[idx] }}
                  ></div>
                  <span className="text-gray-500 uppercase truncate max-w-[120px]">
                    {item.name}
                  </span>
                </div>
                <span className="text-gray-900">{item.value} lượt</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Package Breakdown Table-style View */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white border border-gray-50 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">
            Chi tiết hiệu suất gói cơm
          </h2>
          <Badge className="bg-emerald-50 text-emerald-600 font-black text-[9px] uppercase tracking-widest px-3 h-6 rounded-lg border-none">
            DỮ LIỆU THỜI GIAN THỰC
          </Badge>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Loại gói cơm
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Số lượng bán
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Doanh thu
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">
                    Hiệu suất
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenue?.breakdown.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-orange-50/30 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg bg-${idx % 2 === 0 ? "orange" : "blue"}-50 flex items-center justify-center text-${idx % 2 === 0 ? "orange" : "blue"}-600`}
                        >
                          <Package size={16} />
                        </div>
                        <span className="font-black text-gray-900 uppercase text-xs tracking-tight">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold text-gray-600 text-sm">
                        {item.count} gói
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-gray-900 text-sm">
                        {formatVND(item.revenue)}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{
                              width: `${(item.revenue / (revenue?.totalRevenue || 1)) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-black text-gray-400">
                          {Math.round(
                            (item.revenue / (revenue?.totalRevenue || 1)) * 100,
                          )}
                          %
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
