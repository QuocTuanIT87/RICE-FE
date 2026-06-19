// Shared TypeScript types cho frontend

// User types
export type UserRole = "admin" | "user";
export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked?: boolean;
  balance?: number; // Số dư tiền ví VND (mới)
  totalSpent?: number; // Tổng chi tiêu tích lũy
  vipLevelCode?: string; // normal, silver, gold, diamond
  vipLevelName?: string; // Tên hạng VIP
  vipDiscountRate?: number; // Phần trăm giảm giá VIP
  createdAt?: string;
  updatedAt?: string;
}

export interface VipLevel {
  _id: string;
  levelCode: string;
  name: string;
  threshold: number;
  discountRate: number;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Package Purchase/Deposit types
export type PurchaseStatus = "pending" | "approved" | "rejected";
export type PackageType = "normal" | "no-rice";

export interface DepositRequest {
  _id: string;
  userId: User | string;
  amount: number;
  status: PurchaseStatus;
  voucherCode?: string;
  bonusAmount?: number;
  requestedAt: string;
  processedAt?: string;
  createdAt?: string;
}

// System Config Type
export interface SystemConfig {
  _id: string;
  isMaintenance: boolean;
  maintenanceMessage?: string;
  websiteName: string;
  websiteLogo?: string;
  websiteBanner?: string;
  contactPhone?: string;
  priceNormal: number;
  priceNoRice: number;
  bankId: string;
  bankAccountNo: string;
  bankAccountName: string;
}

// Menu types
export type MenuCategory = "new" | "daily" | "special";

export interface MenuItem {
  _id: string;
  dailyMenuId: string;
  name: string;
  category: MenuCategory;
}

export interface DailyMenu {
  _id: string;
  menuDate: string;
  rawContent: string;
  beginAt: string;
  endAt: string;
  isLocked: boolean;
  menuItems?: MenuItem[];
  canOrder?: boolean;
}

// Order types
export interface OrderItem {
  _id: string;
  orderId: string;
  menuItemId: MenuItem | string;
  quantity: number;
  note?: string; // Ghi chú của khách hàng
}

export interface Order {
  _id: string;
  userId: User | string;
  dailyMenuId: DailyMenu | string;
  orderType?: "normal" | "no-rice"; // Loại đặt: có cơm hoặc không cơm
  isConfirmed: boolean;
  totalPrice?: number; // Tổng tiền đơn hàng (mới)
  voucherCode?: string;
  discountAmount?: number;
  vipDiscountAmount?: number; // Số tiền được giảm từ đặc quyền VIP
  vipLevelAtOrder?: string; // Tên cấp độ VIP lúc đặt đơn
  orderedAt: string;
  orderItems?: OrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Statistics types
export interface DashboardStats {
  todayOrders: number;
  pendingPurchaseRequests: number;
  monthlyRevenue: number;
  todayMenuExists: boolean;
  todayMenuLocked: boolean;
  totalUsers?: number;
  activePackages?: number;
  todayMenus?: number;
  topItems?: Array<{ name: string; count: number }>;
}

export interface RevenueStats {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalPackagesSold: number;
  totalOrders: number;
  breakdown: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

// Pagination types
export interface PaginatedData<T> {
  docs: T[];
  total: number;
  limit: number;
  page: number;
  pages: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Voucher interface
export interface Voucher {
  _id: string;
  code: string;
  description: string;
  voucherType: "deposit" | "order";
  discountType: "fixed" | "percentage";
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  usedByUsers: string[];
  isPublic: boolean;
  targetUsers?: string[];
  createdAt?: string;
  updatedAt?: string;
}
