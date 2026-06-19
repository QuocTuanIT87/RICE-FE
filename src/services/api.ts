import { showLicenseOverlay } from "@/utils/licenseOverlay";
import axios from "axios";
import { store } from "@/store";
import { logout } from "@/store/authSlice";
import type {
  ApiResponse,
  User,
  DailyMenu,
  MenuItem,
  Order,
  DashboardStats,
  RevenueStats,
  PackageType,
  PaginatedData,
  DepositRequest,
  VipLevel,
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
      const hasToken = store.getState().auth.token || store.getState().auth.isAuthenticated;
      if (hasToken) {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }

    // Xử lý lỗi bản quyền (License Key)
    if (error.response?.data?.error?.code === "LICENSE_REQUIRED") {
      showLicenseOverlay(error.response.data.error.message);
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
  getTopVip: () => api.get<ApiResponse<any[]>>("/users/leaderboard/vip"),
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
      ApiResponse<{ user: User; packages: DepositRequest[]; orders: Order[] }>
    >(`/users/${id}`),

  blockUser: (id: string) => api.patch<ApiResponse<User>>(`/users/${id}/block`),

  unblockUser: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/unblock`),

  resetPassword: (id: string) =>
    api.patch<ApiResponse>(`/users/${id}/reset-password`),

  updateBalance: (id: string, balance: number) =>
    api.put<ApiResponse<User>>(`/users/${id}/balance`, { balance }),
};

// =============================================
// DEPOSIT REQUESTS API
// =============================================
export const depositRequestsApi = {
  getMyRequests: () =>
    api.get<ApiResponse<DepositRequest[]>>("/deposit-requests/my"),

  createRequest: (amount: number, voucherCode?: string) =>
    api.post<ApiResponse<DepositRequest>>("/deposit-requests", { amount, voucherCode }),

  // Admin
  getAllRequests: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<DepositRequest>>>("/deposit-requests", {
      params,
    }),

  approveRequest: (id: string) =>
    api.post<ApiResponse>(`/deposit-requests/${id}/approve`),

  rejectRequest: (id: string) =>
    api.post<ApiResponse>(`/deposit-requests/${id}/reject`),
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
    voucherCode?: string,
  ) => api.post<ApiResponse<Order>>("/orders", { items, orderType, menuId, voucherCode }),

  deleteOrder: (id: string) => api.delete<ApiResponse>(`/orders/${id}`),

  // Admin
  getOrdersByDate: (date: string, page?: number, limit?: number, menuId?: string) =>
    api.get<
      ApiResponse<{
        menus?: DailyMenu[];
        menu: DailyMenu;
        orders: PaginatedData<Order>;
        summary: Array<{ name: string; count: number }>;
      }>
    >(`/orders/by-date/${date}`, { params: { page, limit, menuId } }),

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
// VIP LEVELS API
// =============================================
export const vipLevelsApi = {
  getLevels: () => api.get<ApiResponse<VipLevel[]>>("/vip-levels"),
  createLevel: (data: any) => api.post<ApiResponse<VipLevel>>("/vip-levels", data),
  updateLevel: (id: string, data: any) =>
    api.put<ApiResponse<VipLevel>>(`/vip-levels/${id}`, data),
  deleteLevel: (id: string) => api.delete<ApiResponse>(`/vip-levels/${id}`),
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
  checkVoucher: (code: string, amount: number, voucherType?: "deposit" | "order") =>
    api.post<
      ApiResponse<{
        voucherId: string;
        code: string;
        discountType: string;
        discountValue: number;
        discountAmount: number;
        finalPrice: number;
      }>
    >("/vouchers/check", { code, amount, voucherType }),
  getMyVouchers: (voucherType?: "deposit" | "order") =>
    api.get<ApiResponse<any[]>>("/vouchers/my", { params: voucherType ? { voucherType } : {} }),
};

// =============================================
// SYSTEM API
// =============================================
export const systemApi = {
  getConfig: () => api.get<ApiResponse<any>>("/system/config"),
  updateConfig: (data: any) => api.put<ApiResponse<any>>("/system/config", data),
};

export default api;
