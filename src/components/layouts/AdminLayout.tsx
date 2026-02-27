import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";

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
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white fixed h-full flex flex-col">
        {/* Logo at top */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍚</span>
            <div>
              <h1 className="font-bold text-lg">Admin Panel</h1>
              <p className="text-xs text-gray-400">Web Đặt Cơm</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
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

        {/* User Menu at bottom */}
        <div className="relative border-t border-gray-800">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 w-full p-4 hover:bg-gray-800 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-lg font-bold">
              {user?.name?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <ChevronUp
              className={cn(
                "w-4 h-4 transition-transform",
                showDropdown && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown Menu - opens upward */}
          {showDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden z-[60]">
              {/* Thông tin cá nhân */}
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-xl font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="font-semibold">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  <p>
                    <span className="text-gray-500">Vai trò:</span>{" "}
                    <span className="px-2 py-0.5 bg-orange-500 text-white rounded">
                      {user?.role === "admin" ? "Quản trị viên" : "Người dùng"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">ID:</span>{" "}
                    <span className="font-mono">
                      {user?._id?.slice(-8) || user?.id?.slice(-8)}
                    </span>
                  </p>
                </div>
              </div>
              {/* Nút đăng xuất */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                className="flex items-center gap-2 w-full px-4 py-3 text-red-400 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        <Outlet />
      </main>

      {/* Click outside to close dropdown - chỉ cover main content, không cover sidebar */}
      {showDropdown && (
        <div
          className="fixed inset-0 left-64 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
