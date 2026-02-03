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
} from "@/types";

// Tạo axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
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
      store.dispatch(logout());
      window.location.href = "/login";
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

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),
};

// =============================================
// USERS API (Admin)
// =============================================
export const usersApi = {
  getUsers: (params?: {
    role?: string;
    isBlocked?: boolean;
    search?: string;
  }) => api.get<ApiResponse<User[]>>("/users", { params }),

  getUserById: (id: string) =>
    api.get<ApiResponse<{ user: User; packages: UserPackage[] }>>(
      `/users/${id}`,
    ),

  blockUser: (id: string) => api.patch<ApiResponse<User>>(`/users/${id}/block`),

  unblockUser: (id: string) =>
    api.patch<ApiResponse<User>>(`/users/${id}/unblock`),
};

// =============================================
// MEAL PACKAGES API
// =============================================
export const mealPackagesApi = {
  getPackages: (isActive?: boolean) =>
    api.get<ApiResponse<MealPackage[]>>("/meal-packages", {
      params: isActive !== undefined ? { isActive } : {},
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

  createRequest: (mealPackageId: string) =>
    api.post<ApiResponse<PackagePurchaseRequest>>("/package-purchases", {
      mealPackageId,
    }),

  // Admin
  getAllRequests: (status?: string) =>
    api.get<ApiResponse<PackagePurchaseRequest[]>>("/package-purchases", {
      params: status ? { status } : {},
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
  getMenus: (limit?: number) =>
    api.get<ApiResponse<DailyMenu[]>>("/daily-menus", { params: { limit } }),

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

  getMyTodayOrder: () => api.get<ApiResponse<Order | null>>("/orders/today"),

  createOrder: (
    items: Array<{ menuItemId: string; note?: string }>,
    orderType: PackageType = "normal",
  ) => api.post<ApiResponse<Order>>("/orders", { items, orderType }),

  // Admin
  getOrdersByDate: (date: string) =>
    api.get<
      ApiResponse<{
        menu: DailyMenu;
        orders: Order[];
        summary: Array<{ name: string; count: number }>;
      }>
    >(`/orders/by-date/${date}`),

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

export default api;
