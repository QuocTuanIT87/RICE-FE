import axios from "axios";
import { store } from "@/store";
import { logout } from "@/store/authSlice";
import type {
  ApiResponse,
  User,
  MealPackage,
  UserPackage,
  PackagePurchaseRequest,
  DailyMenu,
  MenuItem,
  Order,
  DashboardStats,
  RevenueStats,
  PackageType,
  PaginatedData,
} from "@/types";

// API Base URL - lấy từ biến môi trường, chỉ cần thay đổi ở file .env
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - xử lý lỗi 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Không logout nếu là request /auth/me bị 401 (sẽ được xử lý ở AuthInitializer)
    const isAuthMeRequest = error.config?.url === "/auth/me";

    if (error.response?.status === 401 && !isAuthMeRequest) {
      // Chỉ redirect nếu user ĐANG đăng nhập (có token) mà bị 401
      // User chưa đăng nhập thì không redirect, để họ xem trang công khai
      const hasToken = store.getState().auth.token || store.getState().auth.isAuthenticated;
      if (hasToken) {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// =============================================
// AUTH API
// =============================================
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ email: string }>>("/auth/register", data),

  verifyOTP: (data: { email: string; otp: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>(
      "/auth/verify-otp",
      data,
    ),

  resendOTP: (email: string) =>
    api.post<ApiResponse>("/auth/resend-otp", { email }),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ token: string; user: User }>>("/auth/login", data),

  logout: () => api.post<ApiResponse>("/auth/logout"),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.patch<ApiResponse<User>>("/auth/profile", data),

  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.patch<ApiResponse>("/auth/change-password", data),
};

// =============================================
// USERS API (Admin)
// =============================================
export const usersApi = {
  getLeaderboard: () => api.get<ApiResponse<any[]>>("/users/leaderboard"),
  getTopCoins: () => api.get<ApiResponse<any[]>>("/users/leaderboard/coins"),
  getTopOrders: () => api.get<ApiResponse<any[]>>("/users/leaderboard/orders"),

  getUsers: (params?: {
    role?: string;
    isBlocked?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<ApiResponse<PaginatedData<User>>>("/users", { params }),

  getUserById: (id: string) =>
    api.get<
      ApiResponse<{ user: User; packages: UserPackage[]; orders: Order[] }>
    >(`/users/${id}`),

  blockUser: (id: string) => api.patch<ApiResponse<User>>(`/users/${id}/block`),

  unblockUser: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/unblock`),

  resetPassword: (id: string) =>
    api.patch<ApiResponse>(`/users/${id}/reset-password`),
};

// =============================================
// MEAL PACKAGES API
// =============================================
export const mealPackagesApi = {
  getPackages: (params?: { isActive?: boolean; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<MealPackage>>>("/meal-packages", {
      params,
    }),

  getPackageById: (id: string) =>
    api.get<ApiResponse<MealPackage>>(`/meal-packages/${id}`),

  createPackage: (data: Partial<MealPackage>) =>
    api.post<ApiResponse<MealPackage>>("/meal-packages", data),

  updatePackage: (id: string, data: Partial<MealPackage>) =>
    api.put<ApiResponse<MealPackage>>(`/meal-packages/${id}`, data),

  deletePackage: (id: string) =>
    api.delete<ApiResponse>(`/meal-packages/${id}`),
};

// =============================================
// PACKAGE PURCHASES API
// =============================================
export const packagePurchasesApi = {
  getMyRequests: () =>
    api.get<ApiResponse<PackagePurchaseRequest[]>>("/package-purchases/my"),

  createRequest: (mealPackageId: string, voucherCode?: string) =>
    api.post<ApiResponse<PackagePurchaseRequest>>("/package-purchases", {
      mealPackageId,
      voucherCode,
    }),

  // Admin
  getAllRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<PackagePurchaseRequest>>>("/package-purchases", {
      params,
    }),

  approveRequest: (id: string) =>
    api.post<ApiResponse>(`/package-purchases/${id}/approve`),

  rejectRequest: (id: string) =>
    api.post<ApiResponse>(`/package-purchases/${id}/reject`),
};

// =============================================
// USER PACKAGES API
// =============================================
export const userPackagesApi = {
  getMyPackages: () => api.get<ApiResponse<UserPackage[]>>("/user-packages/my"),

  getMyActivePackages: () =>
    api.get<ApiResponse<UserPackage[]>>("/user-packages/my/active"),

  setActivePackage: (id: string) =>
    api.post<ApiResponse<UserPackage>>(`/user-packages/${id}/set-active`),
};

// =============================================
// DAILY MENUS API
// =============================================
export const dailyMenusApi = {
  getMenus: (params?: { page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<DailyMenu>>>("/daily-menus", { params }),

  getTodayMenu: () => api.get<ApiResponse<DailyMenu[]>>("/daily-menus/today"),

  getMenuById: (id: string) =>
    api.get<ApiResponse<DailyMenu>>(`/daily-menus/${id}`),

  // Admin
  previewMenu: (rawContent: string) =>
    api.post<ApiResponse<MenuItem[]>>("/daily-menus/preview", { rawContent }),

  createMenu: (data: {
    rawContent: string;
    menuDate?: string;
    beginAt?: string;
    endAt?: string;
  }) =>
    api.post<ApiResponse<{ menu: DailyMenu; menuItems: MenuItem[] }>>(
      "/daily-menus",
      data,
    ),

  updateMenu: (
    id: string,
    data: {
      rawContent?: string;
      beginAt?: string;
      endAt?: string;
      isLocked?: boolean;
    },
  ) => api.put<ApiResponse<DailyMenu>>(`/daily-menus/${id}`, data),

  lockMenu: (id: string) =>
    api.patch<ApiResponse<DailyMenu>>(`/daily-menus/${id}/lock`),

  unlockMenu: (id: string) =>
    api.patch<ApiResponse<DailyMenu>>(`/daily-menus/${id}/unlock`),
};

// =============================================
// ORDERS API
// =============================================
export const ordersApi = {
  getMyOrders: () => api.get<ApiResponse<Order[]>>("/orders/my"),

  getMyTodayOrder: (menuId?: string) =>
    api.get<ApiResponse<Order | null>>("/orders/today", {
      params: menuId ? { menuId } : {},
    }),

  createOrder: (
    items: Array<{ menuItemId: string; note?: string; quantity?: number }>,
    orderType: PackageType = "normal",
    menuId: string,
  ) => api.post<ApiResponse<Order>>("/orders", { items, orderType, menuId }),

  deleteOrder: (id: string) => api.delete<ApiResponse>(`/orders/${id}`),

  // Admin
  getOrdersByDate: (date: string, page?: number, limit?: number) =>
    api.get<
      ApiResponse<{
        menu: DailyMenu;
        orders: PaginatedData<Order>;
        summary: Array<{ name: string; count: number }>;
      }>
    >(`/orders/by-date/${date}`, { params: { page, limit } }),

  confirmAllOrders: (menuId: string) =>
    api.post<ApiResponse<{ confirmedCount: number }>>("/orders/confirm-all", {
      menuId,
    }),

  getCopyText: (menuId: string) =>
    api.get<
      ApiResponse<{
        copyText: string;
        summary: Array<{ name: string; count: number }>;
      }>
    >(`/orders/copy-text/${menuId}`),
};

// =============================================
// STATISTICS API (Admin)
// =============================================
export const statisticsApi = {
  getDashboard: () =>
    api.get<ApiResponse<DashboardStats>>("/statistics/dashboard"),

  getRevenue: (params?: { period?: string; date?: string }) =>
    api.get<ApiResponse<RevenueStats>>("/statistics/revenue", { params }),

  getMenuItemStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get<
      ApiResponse<{
        items: Array<{ name: string; count: number }>;
      }>
    >("/statistics/menu-items", { params }),
};

// =============================================
// GAME COINS API
// =============================================
export const gameCoinsApi = {
  getBalance: () =>
    api.get<ApiResponse<{ gameCoins: number }>>("/game-coins/balance"),

  updateCoins: (delta: number) =>
    api.post<ApiResponse<{ gameCoins: number }>>("/game-coins/update", {
      delta,
    }),

  exchange: (packageId: string) =>
    api.post<ApiResponse<{ gameCoins: number }>>("/game-coins/exchange", {
      packageId,
    }),
};

// =============================================
// VOUCHERS API
// =============================================
export const vouchersApi = {
  getVouchers: (params?: { page?: number; limit?: number }) => 
    api.get<ApiResponse<PaginatedData<any>>>("/vouchers", { params }),
  createVoucher: (data: any) => api.post<ApiResponse<any>>("/vouchers", data),
  updateVoucher: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/vouchers/${id}`, data),
  deleteVoucher: (id: string) => api.delete<ApiResponse>(`/vouchers/${id}`),
  checkVoucher: (code: string, amount: number) =>
    api.post<
      ApiResponse<{
        voucherId: string;
        code: string;
        discountType: string;
        discountValue: number;
        discountAmount: number;
        finalPrice: number;
      }>
    >("/vouchers/check", { code, amount }),
  getMyVouchers: () => api.get<ApiResponse<any[]>>("/vouchers/my"),
};

// =============================================
// SYSTEM API
// =============================================
export const systemApi = {
  getConfig: () => api.get<ApiResponse<any>>("/system/config"),
  updateConfig: (data: any) => api.put<ApiResponse<any>>("/system/config", data),
};

export default api;
