import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import {
  User,
  LogOut,
  Package,
  History,
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Home,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";

// Menu cho khách hàng (user thường)
const customerNavItems = [
  { path: "/", label: "Trang chủ", icon: Home },
  { path: "/order", label: "Đặt cơm", icon: UtensilsCrossed },
  { path: "/packages", label: "Mua gói", icon: ShoppingBag },
];

// Menu cho admin
const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/packages", label: "Quản lý gói", icon: Package },
  { path: "/admin/menus", label: "Quản lý menu", icon: UtensilsCrossed },
  { path: "/admin/orders", label: "Quản lý đơn", icon: ClipboardList },
];

// Dropdown menu cho user
const customerDropdownItems = [
  { path: "/profile", label: "Trang cá nhân", icon: User },
  { path: "/my-packages", label: "Gói của tôi", icon: Package },
  { path: "/order-history", label: "Lịch sử đặt cơm", icon: History },
];

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  // Chọn menu items dựa trên role
  const navItems = isAdmin ? adminNavItems : customerNavItems;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const isActiveRoute = (path: string) => {
    if (path === "/" || path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to={isAdmin ? "/admin" : "/"}
              className="flex items-center gap-2"
            >
              <span className="text-3xl">🍚</span>
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text">
                  Web Đặt Cơm
                </span>
                {isAdmin && (
                  <span className="text-xs text-orange-600 font-medium -mt-1">
                    Admin Panel
                  </span>
                )}
              </div>
            </Link>

            {/* Navigation - Based on Role */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-orange-100 text-orange-600 font-medium"
                        : "text-gray-600 hover:text-orange-500 hover:bg-orange-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAdmin ? "bg-red-100" : "bg-orange-100"
                      }`}
                    >
                      <User
                        className={`w-4 h-4 ${
                          isAdmin ? "text-red-600" : "text-orange-600"
                        }`}
                      />
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span
                        className={`text-xs ${
                          isAdmin ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        {isAdmin ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </div>
                  </Button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border animate-fade-in">
                      {/* Role Badge */}
                      <div className="px-4 py-2 border-b mb-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <span
                          className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                            isAdmin
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isAdmin ? "👑 Admin" : "👤 Khách hàng"}
                        </span>
                      </div>

                      {/* Customer-only dropdown items */}
                      {!isAdmin &&
                        customerDropdownItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setMenuOpen(false)}
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          );
                        })}

                      {/* Admin: Quick access to customer view */}
                      {isAdmin && (
                        <>
                          <Link
                            to="/"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setMenuOpen(false)}
                          >
                            <Home className="w-4 h-4" />
                            Xem trang khách hàng
                          </Link>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium"
                            onClick={() => setMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Trang quản trị
                          </Link>
                        </>
                      )}

                      {/* Logout */}
                      <div className="border-t mt-1 pt-1">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost">Đăng nhập</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Đăng ký</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 Web Đặt Cơm. Đặt cơm nhanh chóng và tiện lợi! 🍚
          </p>
        </div>
      </footer>
    </div>
  );
}
