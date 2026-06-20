import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, usersApi, notificationsApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { useShowBalance } from "@/hooks/useShowBalance";
import {
  User,
  LogOut,
  History,
  UtensilsCrossed,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Home,
  ChevronDown,
  Menu,
  X,
  Coins,
  Trophy,
  Wallet,
  Eye,
  EyeOff,
  MessageSquare,
  Crown,
  Bell,
  Gift,
  AlertCircle,
  ArrowUp,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import PriceNoticeBanner from "@/components/PriceNoticeBanner";
import VipMascots from "@/components/VipMascots";
import { formatVND, cn } from "@/lib/utils";
import { useSocket } from "@/contexts/SocketContext";
import { swalToast } from "@/utils/swal";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

const customerNavItems = [
  { path: "/", label: "Trang chủ", icon: Home },
  { path: "/order", label: "Đặt cơm", icon: UtensilsCrossed },
  { path: "/wallet", label: "Ví tiền", icon: Coins },
  { path: "/vip", label: "Hội Viên VIP", icon: Crown },
  { path: "/forum", label: "Diễn đàn", icon: MessageSquare },
  { path: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
];

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/deposits", label: "Duyệt nạp tiền", icon: Coins },
  { path: "/admin/menus", label: "Quản lý menu", icon: UtensilsCrossed },
  { path: "/admin/orders", label: "Quản lý đơn", icon: ClipboardList },
];

const customerDropdownItems = [
  { path: "/profile", label: "Trang cá nhân", icon: User },
  { path: "/wallet", label: "Ví của tôi", icon: Coins },
  { path: "/vip", label: "Hội Viên VIP", icon: Crown },
  { path: "/order-history", label: "Lịch sử đặt cơm", icon: History },
];

export default function MainLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showBalance, setShowBalance] = useShowBalance();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : customerNavItems;
  const { config: systemConfig } = useAppSelector((state) => state.system);
  const isVip = user?.hasMembership;
  const websiteName = (isVip && user?.vipCosmetics?.vipWebsiteName) ? user.vipCosmetics.vipWebsiteName : (systemConfig?.websiteName || "Thiên Hương Các");
  const websiteLogo = (isVip && user?.vipCosmetics?.vipWebsiteLogo) ? user.vipCosmetics.vipWebsiteLogo : (systemConfig?.websiteLogo || "");
  const contactPhone = systemConfig?.contactPhone || "0123.456.789";

  const [notifOpen, setNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch top leaderboards for marquee
  const { data: topVipData } = useQuery({
    queryKey: ["topVip"],
    queryFn: () => usersApi.getTopVip(),
    enabled: !isAdmin,
  });

  const { data: topOrdersData } = useQuery({
    queryKey: ["topOrders"],
    queryFn: () => usersApi.getTopOrders(),
    enabled: !isAdmin,
  });

  const topVip = topVipData?.data.data || [];
  const topOrders = topOrdersData?.data.data || [];

  // Fetch notifications
  const { data: notifResponse } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
    enabled: isAuthenticated,
  });

  const notifications = notifResponse?.data.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      swalToast({ title: "Đã đọc tất cả thông báo!", icon: "success" });
    },
  });

  // Socket setup for notifications
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleNotificationReceived = (newNotif: any) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      swalToast({
        title: `🔔 Thông báo mới: ${newNotif.title}`,
        icon: newNotif.type === "alert" ? "warning" : "info",
      });
    };

    socket.on("notification_received", handleNotificationReceived);

    return () => {
      socket.off("notification_received", handleNotificationReceived);
    };
  }, [socket, isAuthenticated, queryClient]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Scroll to Top effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
    <div
      className={cn(
        "min-h-screen flex flex-col transition-all duration-300",
        user?.hasMembership &&
          user?.vipCosmetics?.vipTheme &&
          user.vipCosmetics.vipTheme !== "default" &&
          `theme-${user.vipCosmetics.vipTheme}`,
      )}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to={isAdmin ? "/admin" : "/"}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 group-hover:shadow-lg group-hover:shadow-orange-300 transition-shadow overflow-hidden">
                {websiteLogo ? (
                  <img
                    src={websiteLogo}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg">🍚</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  {websiteName}
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
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-orange-100 shadow-sm">
                    <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Wallet size={14} className="text-orange-500" />
                    </div>
                    <div className="flex flex-col pr-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">
                        Số dư ví
                      </span>
                      <span className="text-sm font-black text-orange-600 leading-none">
                        {showBalance ? formatVND(user?.balance || 0) : "••••••"}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-gray-400 hover:text-gray-600 transition-colors ml-1 p-0.5 rounded-md hover:bg-gray-50 focus:outline-none"
                      title={showBalance ? "Ẩn số dư" : "Hiện số dư"}
                    >
                      {showBalance ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}

              {isAuthenticated && (
                <div className="relative" ref={notifDropdownRef}>
                  {/* Bell Icon Trigger */}
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={cn(
                      "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all border",
                      notifOpen
                        ? "bg-gray-50 border-gray-200 shadow-sm"
                        : "border-transparent hover:bg-gray-50 hover:border-gray-100",
                    )}
                  >
                    <Bell
                      size={18}
                      className={cn(
                        "text-gray-500",
                        unreadCount > 0 && "text-orange-500 animate-pulse",
                      )}
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-orange-500 text-white font-black text-[9px] px-1 rounded-full flex items-center justify-center border border-white shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bell Dropdown */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden animate-fade-in z-50">
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <span className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                          🔔 Thông báo
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded-full">
                              {unreadCount} mới
                            </span>
                          )}
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllReadMutation.mutate()}
                            className="text-xs text-orange-500 hover:text-orange-600 font-black transition-colors"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>

                      {/* Dropdown Content */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                            <span className="text-2xl mb-1">📭</span>
                            <p className="text-xs font-bold">Hộp thư trống</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((notif: any) => {
                            const iconMap: Record<string, React.ReactNode> = {
                              gift: (
                                <Gift size={14} className="text-amber-500" />
                              ),
                              alert: (
                                <AlertCircle
                                  size={14}
                                  className="text-red-500"
                                />
                              ),
                              system: (
                                <Bell size={14} className="text-sky-500" />
                              ),
                            };
                            const bgMap: Record<string, string> = {
                              gift: "bg-amber-500/10",
                              alert: "bg-red-500/10",
                              system: "bg-sky-500/10",
                            };
                            return (
                              <div
                                key={notif._id}
                                onClick={() => {
                                  if (!notif.isRead) {
                                    markReadMutation.mutate(notif._id);
                                  }
                                  setNotifOpen(false);
                                  navigate("/notifications");
                                }}
                                className={cn(
                                  "flex gap-3 p-3.5 hover:bg-gray-50/80 transition-colors cursor-pointer select-none",
                                  !notif.isRead && "bg-orange-500/[0.015]",
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                                    bgMap[notif.type] || "bg-sky-500/10",
                                  )}
                                >
                                  {iconMap[notif.type] || <Bell size={14} />}
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex justify-between items-start gap-1">
                                    <h4
                                      className={cn(
                                        "text-xs font-extrabold truncate text-gray-800 leading-tight",
                                        !notif.isRead &&
                                          "text-gray-900 font-black",
                                      )}
                                    >
                                      {notif.title}
                                    </h4>
                                    <span className="text-[9px] text-gray-400 shrink-0 font-semibold">
                                      {notif.createdAt
                                        ? formatDistanceToNow(
                                            new Date(notif.createdAt),
                                            {
                                              addSuffix: true,
                                              locale: vi,
                                            },
                                          )
                                        : "Vừa xong"}
                                    </span>
                                  </div>
                                  <p
                                    className={cn(
                                      "text-[11px] text-gray-500 line-clamp-2 leading-normal",
                                      !notif.isRead &&
                                        "text-gray-700 font-medium",
                                    )}
                                  >
                                    {notif.content}
                                  </p>
                                </div>
                                {!notif.isRead && (
                                  <div className="flex items-center shrink-0">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Footer */}
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="block text-center py-2.5 text-xs font-black text-orange-500 hover:text-orange-600 hover:bg-orange-50/50 border-t border-gray-100 transition-colors"
                      >
                        Xem tất cả thông báo
                      </Link>
                    </div>
                  )}
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
                      className={`w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center text-sm font-black text-white ${
                        user?.avatar
                          ? ""
                          : isAdmin
                            ? "bg-gradient-to-br from-red-500 to-rose-600"
                            : "bg-gradient-to-br from-orange-400 to-red-500"
                      } shadow-sm`}
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userInitial
                      )}
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
                            className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-sm font-black text-white ${
                              user?.avatar
                                ? ""
                                : isAdmin
                                  ? "bg-gradient-to-br from-red-500 to-rose-600"
                                  : "bg-gradient-to-br from-orange-400 to-red-500"
                            }`}
                          >
                            {user?.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              userInitial
                            )}
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

      {/* Marquee Ticker for Customers */}
      {!isAdmin && (topVip.length > 0 || topOrders.length > 0) && (
        <div className="bg-orange-50/70 overflow-hidden py-3 border-b border-orange-100/50 backdrop-blur-sm shadow-sm flex items-center">
          {/* We render the content twice side-by-side to create a seamless infinite loop */}
          {[1, 2].map((setIndex) => (
            <div
              key={`marquee-set-${setIndex}`}
              className="animate-marquee whitespace-nowrap flex-shrink-0 flex items-center text-[15px] font-medium text-gray-600 tracking-wide select-none"
              aria-hidden={setIndex === 2 ? "true" : "false"}
            >
              {topOrders.slice(0, 3).map((u: any, idx: number) => (
                <span key={`order-${setIndex}-${idx}`} className="mx-8">
                  🍚{" "}
                  <span className="font-bold text-orange-600">
                    Top {idx + 1} Đặt Cơm:
                  </span>{" "}
                  <span className="font-bold text-gray-900">
                    Đạo hữu <span className="text-orange-500">{u.name}</span>
                  </span>{" "}
                  với{" "}
                  <strong className="text-orange-600">
                    {u.orderCount} đơn
                  </strong>
                </span>
              ))}
              {topVip.slice(0, 3).map((u: any, idx: number) => (
                <span key={`vip-${setIndex}-${idx}`} className="mx-8">
                  👑{" "}
                  <span className="font-bold text-amber-600">
                    Top {idx + 1} Phú Hào:
                  </span>{" "}
                  <span className="font-bold text-gray-900">
                    Đạo hữu <span className="text-amber-500">{u.name}</span>
                  </span>{" "}
                  đạt cấp{" "}
                  <strong className="text-amber-600">
                    {u.vipLevelName || "Thành viên thường"}
                  </strong>
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Banner */}
      {isAuthenticated && !isAdmin && <PriceNoticeBanner />}

      {/* Floating Mascots for VIPs */}
      {isAuthenticated && !isAdmin && <VipMascots />}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-2">
          <p className="text-gray-400 text-sm italic">
            © 2026 {websiteName}. Chúc các đạo hữu ăn cơm ngon miệng! 🍚
          </p>
          <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">
            Hotline: <span className="text-orange-500">{contactPhone}</span>
          </p>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
}
