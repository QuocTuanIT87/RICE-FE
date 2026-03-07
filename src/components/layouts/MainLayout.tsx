import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { authApi } from "@/services/api";
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
  ChevronDown,
  Menu,
  X,
  Gamepad2,
  Coins,
  Trophy,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import PriceNoticeBanner from "@/components/PriceNoticeBanner";

const customerNavItems = [
  { path: "/", label: "Trang chủ", icon: Home },
  { path: "/order", label: "Đặt cơm", icon: UtensilsCrossed },
  { path: "/packages", label: "Mua gói", icon: ShoppingBag },
  { path: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
  { path: "/giai-tri", label: "Giải trí", icon: Gamepad2 },
];

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/packages", label: "Quản lý gói", icon: Package },
  { path: "/admin/menus", label: "Quản lý menu", icon: UtensilsCrossed },
  { path: "/admin/orders", label: "Quản lý đơn", icon: ClipboardList },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : customerNavItems;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const isActiveRoute = (path: string) => {
    if (path === "/" || path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to={isAdmin ? "/admin" : "/"}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 group-hover:shadow-lg group-hover:shadow-orange-300 transition-shadow">
                <span className="text-white text-lg">🍚</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Web Đặt Cơm
                </span>
                {isAdmin && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider -mt-0.5">
                    Admin Panel
                  </span>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Coins size={14} className="text-amber-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">
                        Xu hiện có
                      </span>
                      <span className="text-sm font-black text-amber-600 leading-none">
                        {(user?.gameCoins || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  {/* User Button */}
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all border ${
                      menuOpen
                        ? "bg-gray-50 border-gray-200 shadow-sm"
                        : "border-transparent hover:bg-gray-50 hover:border-gray-100"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white ${
                        isAdmin
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : "bg-gradient-to-br from-orange-400 to-red-500"
                      } shadow-sm`}
                    >
                      {userInitial}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-bold text-gray-900 leading-tight">
                        {user?.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold leading-tight ${
                          isAdmin ? "text-red-500" : "text-gray-400"
                        }`}
                      >
                        {isAdmin ? "Quản trị viên" : "Khách hàng"}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`hidden md:block text-gray-400 transition-transform ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-fade-in">
                      {/* User info */}
                      <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white ${
                              isAdmin
                                ? "bg-gradient-to-br from-red-500 to-rose-600"
                                : "bg-gradient-to-br from-orange-400 to-red-500"
                            }`}
                          >
                            {userInitial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user?.name}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 mt-2.5 text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider ${
                            isAdmin
                              ? "bg-red-100 text-red-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {isAdmin ? "👑 Admin" : "👤 Khách hàng"}
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        {!isAdmin &&
                          customerDropdownItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActiveRoute(item.path);
                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                  isActive
                                    ? "bg-orange-50 text-orange-600 font-bold"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                                onClick={() => setMenuOpen(false)}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isActive ? "bg-orange-100" : "bg-gray-100"
                                  }`}
                                >
                                  <Icon
                                    size={15}
                                    className={
                                      isActive
                                        ? "text-orange-500"
                                        : "text-gray-500"
                                    }
                                  />
                                </div>
                                <span className="font-medium">
                                  {item.label}
                                </span>
                              </Link>
                            );
                          })}

                        {isAdmin && (
                          <>
                            <Link
                              to="/"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                              onClick={() => setMenuOpen(false)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Home size={15} className="text-gray-500" />
                              </div>
                              <span className="font-medium">
                                Xem trang khách hàng
                              </span>
                            </Link>
                            <Link
                              to="/admin"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50"
                              onClick={() => setMenuOpen(false)}
                            >
                              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Settings
                                  size={15}
                                  className="text-orange-500"
                                />
                              </div>
                              <span className="font-bold">Trang quản trị</span>
                            </Link>
                          </>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <LogOut size={15} className="text-red-500" />
                          </div>
                          <span className="font-bold">Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      className="text-sm font-bold text-gray-600 hover:text-orange-600 rounded-xl"
                    >
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md shadow-orange-200">
                      Đăng ký
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                {mobileOpen ? (
                  <X size={20} className="text-gray-700" />
                ) : (
                  <Menu size={20} className="text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl animate-fade-in">
            <nav className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Banner */}
      {isAuthenticated && !isAdmin && <PriceNoticeBanner />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2026 Web Đặt Cơm. Đặt cơm nhanh chóng và tiện lợi! 🍚
          </p>
        </div>
      </footer>
    </div>
  );
}
