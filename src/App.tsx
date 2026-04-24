import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setLoading, logout } from "@/store/authSlice";
import { authApi } from "@/services/api";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/contexts/SocketContext";

// Layouts
import MainLayout from "@/components/layouts/MainLayout";
import AdminLayout from "@/components/layouts/AdminLayout";

// Public Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

// User Pages
import OrderPage from "@/pages/OrderPage";
import PackagesPage from "@/pages/PackagesPage";
import PackageDetailPage from "@/pages/PackageDetailPage";
import MyPackagesPage from "@/pages/MyPackagesPage";
import ProfilePage from "@/pages/ProfilePage";
import OrderHistoryPage from "@/pages/OrderHistoryPage";
import EntertainmentPage from "@/pages/EntertainmentPage";
import LeaderboardPage from "@/pages/LeaderboardPage";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPackages from "@/pages/admin/AdminPackages";
import AdminMenus from "@/pages/admin/AdminMenus";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminStatistics from "@/pages/admin/AdminStatistics";
import AdminVouchers from "@/pages/admin/AdminVouchers";
import AdminSystem from "@/pages/admin/AdminSystem";
import MaintenancePage from "@/components/MaintenancePage";
import SystemInitializer from "@/components/SystemInitializer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route component - chỉ cho user (không phải admin)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">🍚</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin không được truy cập trang khách hàng
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

// Public Route - redirect admin về /admin
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">🍚</div>
      </div>
    );
  }

  // Admin đã đăng nhập thì redirect về /admin
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

// Admin Route component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">🍚</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Auth initializer
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      dispatch(setLoading(true));
      try {
        const response = await authApi.getMe();
        if (response.data.data) {
          dispatch(setUser(response.data.data));
        }
      } catch (error: unknown) {
        // Lỗi 401 hoặc network error đều được xử lý im lặng ở đây
        // isAuthenticated mặc định là false
      } finally {
        dispatch(setLoading(false));
      }
    };
    initAuth();
  }, [dispatch]);

  return <>{children}</>;
}

function AppRoutes() {
  const dispatch = useAppDispatch();
  const {
    isMaintenance,
    maintenanceStart,
    maintenanceEnd,
    isLoading: isSystemLoading,
  } = useAppSelector((state) => state.system);
  const { user } = useAppSelector((state) => state.auth);
  const [tick, setTick] = useState(0);

  // Hẹn giờ tự động kích hoạt / kết thúc bảo trì
  useEffect(() => {
    if (!isMaintenance || user?.role === "admin") return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();
    const start = maintenanceStart ? new Date(maintenanceStart).getTime() : 0;
    const end = maintenanceEnd ? new Date(maintenanceEnd).getTime() : 0;

    // Đến giờ bắt đầu -> ép re-render để hiện trang bảo trì
    if (start > now) {
      timers.push(setTimeout(() => setTick((t) => t + 1), start - now));
    }

    // Đến giờ kết thúc -> logout + về trang đăng nhập
    if (end > now) {
      timers.push(
        setTimeout(() => {
          dispatch(logout());
          window.location.href = "/login";
        }, end - now),
      );
    }

    return () => timers.forEach((t) => clearTimeout(t));
  }, [isMaintenance, maintenanceStart, maintenanceEnd, user, dispatch, tick]);

  if (isSystemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Kiểm tra bảo trì với thời gian thực tại
  const now = new Date();
  const isStarted = !maintenanceStart || now >= new Date(maintenanceStart);
  const isExpired = maintenanceEnd && now > new Date(maintenanceEnd);



  if (isMaintenance && user?.role !== "admin" && isStarted && !isExpired) {
    return <MaintenancePage />;
  }

  return (
    <Routes>
      {/* Public routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          }
        />
        <Route
          path="/packages"
          element={
            <PublicRoute>
              <PackagesPage />
            </PublicRoute>
          }
        />
        <Route
          path="/giai-tri"
          element={
            <PublicRoute>
              <EntertainmentPage />
            </PublicRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PublicRoute>
              <LeaderboardPage />
            </PublicRoute>
          }
        />

        {/* Protected user routes */}
        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/packages/:id"
          element={
            <ProtectedRoute>
              <PackageDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-packages"
          element={
            <ProtectedRoute>
              <MyPackagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Auth routes (no layout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="menus" element={<AdminMenus />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="vouchers" element={<AdminVouchers />} />
        <Route path="statistics" element={<AdminStatistics />} />
        <Route path="system" element={<AdminSystem />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">😕</div>
              <h1 className="text-2xl font-bold mb-2">Không tìm thấy trang</h1>
              <a href="/" className="text-orange-600 hover:underline">
                Về trang chủ
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthInitializer>
            <SocketProvider>
              <SystemInitializer>
                <AppRoutes />
                <Toaster />
              </SystemInitializer>
            </SocketProvider>
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
