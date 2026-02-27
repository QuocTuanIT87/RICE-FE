import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { store } from "@/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser, setLoading } from "@/store/authSlice";
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

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminPackages from "@/pages/admin/AdminPackages";
import AdminMenus from "@/pages/admin/AdminMenus";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminStatistics from "@/pages/admin/AdminStatistics";

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
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        dispatch(setLoading(true));
        try {
          const response = await authApi.getMe();
          if (response.data.data) {
            dispatch(setUser(response.data.data));
          }
        } catch (error: unknown) {
          // Chỉ logout khi token thực sự invalid (401), không logout khi network error
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status === 401) {
            // Token invalid, logout đã xử lý trong interceptor
          }
          // Các lỗi khác (network, 500...) giữ token, có thể retry sau
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    initAuth();
  }, [dispatch, token]);

  return <>{children}</>;
}

function AppRoutes() {
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
        <Route path="statistics" element={<AdminStatistics />} />
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
              <AppRoutes />
              <Toaster />
            </SocketProvider>
          </AuthInitializer>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}
