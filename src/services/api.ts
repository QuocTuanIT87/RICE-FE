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
  VipPackage,
  UserMembership,
  ForumPost,
  ForumComment,
  ForumReaction,
  Notification,
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

  updateProfile: (data: {
    name?: string;
    phone?: string;
    vipTheme?: string;
    vipAvatarFrame?: string;
    vipCoverImage?: string;
    vipMascot?: string;
    vipWebsiteName?: string;
    vipWebsiteLogo?: string;
    vipWebsiteBanner?: string;
  }) => api.patch<ApiResponse<User>>("/auth/profile", data),

  updateAvatar: (formData: FormData) =>
    api.patch<ApiResponse<User>>("/auth/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  uploadVipLogo: (formData: FormData) =>
    api.patch<ApiResponse<User>>("/auth/vip-logo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  uploadVipBanner: (formData: FormData) =>
    api.patch<ApiResponse<User>>("/auth/vip-banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

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

  searchUsers: (params?: { search?: string; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<User>>>("/users/search", { params }),

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

  createRequest: (amount: number, voucherCode?: string, requestType?: string, vipPackageId?: string) =>
    api.post<ApiResponse<DepositRequest>>("/deposit-requests", { amount, voucherCode, requestType, vipPackageId }),

  // Admin
  getAllRequests: (params?: { status?: string; requestType?: string; page?: number; limit?: number }) =>
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
// VIP PACKAGES API (Admin CRUD & User Get)
// =============================================
export const vipPackagesApi = {
  getAllPackages: () => api.get<ApiResponse<VipPackage[]>>("/vip-packages/admin"),
  getActivePackages: () => api.get<ApiResponse<VipPackage[]>>("/vip-packages"),
  createPackage: (data: Partial<VipPackage>) => api.post<ApiResponse<VipPackage>>("/vip-packages", data),
  updatePackage: (id: string, data: Partial<VipPackage>) =>
    api.put<ApiResponse<VipPackage>>(`/vip-packages/${id}`, data),
  deletePackage: (id: string) => api.delete<ApiResponse>(`/vip-packages/${id}`),
};

// =============================================
// USER MEMBERSHIPS API
// =============================================
export const userMembershipsApi = {
  buyWithWallet: (vipPackageId: string) =>
    api.post<ApiResponse<UserMembership>>("/user-memberships/buy-with-wallet", { vipPackageId }),
  giftMembership: (receiverId: string, vipPackageId: string) =>
    api.post<ApiResponse<any>>("/user-memberships/gift", { receiverId, vipPackageId }),
  adminGiftMembership: (vipPackageId: string, receiverId?: string, giftAll?: boolean) =>
    api.post<ApiResponse<any>>("/user-memberships/admin-gift", { vipPackageId, receiverId, giftAll }),
};

// =============================================
// FORUM API
// =============================================
export const forumApi = {
  getPosts: (params?: { category?: string; page?: number; limit?: number }) =>
    api.get<ApiResponse<PaginatedData<ForumPost>>>("/forum/posts", { params }),
  getPostById: (id: string) => api.get<ApiResponse<{ post: ForumPost; comments: ForumComment[] }>>(`/forum/posts/${id}`),
  createPost: (data: FormData) =>
    api.post<ApiResponse<ForumPost>>("/forum/posts", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  createComment: (postId: string, content: string, parentId?: string) =>
    api.post<ApiResponse<ForumComment>>(`/forum/posts/${postId}/comment`, { content, parentId }),
  likePost: (postId: string) => api.post<ApiResponse<ForumPost>>(`/forum/posts/${postId}/like`),
  reactPost: (postId: string, type: string) =>
    api.post<ApiResponse<{ reactions: ForumReaction[]; likesCount: number }>>(`/forum/posts/${postId}/react`, { type }),
  reactComment: (commentId: string, type: string) =>
    api.post<ApiResponse<{ reactions: ForumReaction[] }>>(`/forum/comments/${commentId}/react`, { type }),
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
// NOTIFICATIONS API
// =============================================
export const notificationsApi = {
  getNotifications: () =>
    api.get<ApiResponse<Notification[]>>("/notifications"),
  getAdminNotifications: () =>
    api.get<ApiResponse<any[]>>("/notifications/admin"),
  markAsRead: (id: string) =>
    api.patch<ApiResponse>(`/notifications/${id}/read`),
  markAllAsRead: () =>
    api.patch<ApiResponse>("/notifications/read-all"),
  createNotification: (data: {
    userId?: string | null;
    title: string;
    content: string;
    type?: "system" | "gift" | "alert";
  }) =>
    api.post<ApiResponse<Notification>>("/notifications", data),
};

// =============================================
// SYSTEM API
// =============================================
export const systemApi = {
  getConfig: () => api.get<ApiResponse<any>>("/system/config"),
  updateConfig: (data: any) => api.put<ApiResponse<any>>("/system/config", data),
};

// =============================================
// SOCIAL API
// =============================================
import type { PublicProfile } from "@/types";

export const socialApi = {
  sendFriendRequest: (userId: string) =>
    api.post<ApiResponse>(`/social/friends/request/${userId}`),

  acceptFriendRequest: (userId: string) =>
    api.post<ApiResponse>(`/social/friends/accept/${userId}`),

  declineFriendRequest: (userId: string) =>
    api.post<ApiResponse>(`/social/friends/decline/${userId}`),

  unfriend: (userId: string) =>
    api.delete<ApiResponse>(`/social/friends/unfriend/${userId}`),

  getFriendRequests: () =>
    api.get<ApiResponse<{ incoming: User[]; outgoing: User[] }>>("/social/friends/requests"),

  getFriendsList: () =>
    api.get<ApiResponse<User[]>>("/social/friends/list"),

  getFollowersList: () =>
    api.get<ApiResponse<User[]>>("/social/followers"),

  getFollowingList: () =>
    api.get<ApiResponse<User[]>>("/social/following"),

  followUser: (userId: string) =>
    api.post<ApiResponse>(`/social/follow/${userId}`),

  unfollowUser: (userId: string) =>
    api.delete<ApiResponse>(`/social/unfollow/${userId}`),

  getPublicProfile: (userId: string) =>
    api.get<ApiResponse<PublicProfile>>(`/social/profile/${userId}`),
};

export default api;
