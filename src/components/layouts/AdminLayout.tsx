import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Package, label: "Gói đặt cơm", path: "/admin/packages" },
  { icon: Users, label: "Người dùng", path: "/admin/users" },
  { icon: UtensilsCrossed, label: "Menu hôm nay", path: "/admin/menus" },
  { icon: ClipboardList, label: "Đơn đặt cơm", path: "/admin/orders" },
  { icon: BarChart3, label: "Thống kê", path: "/admin/statistics" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white fixed h-full">
        <div className="p-4">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <span className="text-2xl">🍚</span>
            <span className="text-lg font-semibold">Admin Panel</span>
          </Link>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  location.pathname === item.path
                    ? "bg-orange-500 text-white"
                    : "text-gray-300 hover:bg-gray-800",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Back to main site */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về trang chính</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
