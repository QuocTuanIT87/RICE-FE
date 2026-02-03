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
  activePackage?: UserPackage;
  createdAt?: string;
  updatedAt?: string;
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

// Meal Package types
export type PackageType = "normal" | "no-rice";

export interface MealPackage {
  _id: string;
  name: string;
  turns: number;
  price: number;
  validDays: number;
  packageType: PackageType;
  qrCodeImage?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserPackage {
  _id: string;
  userId: string;
  mealPackageId: MealPackage | string;
  packageType: PackageType;
  remainingTurns: number;
  purchasedAt: string;
  expiresAt: string;
  isActive: boolean;
}

// Package Purchase types
export type PurchaseStatus = "pending" | "approved" | "rejected";

export interface PackagePurchaseRequest {
  _id: string;
  userId: User | string;
  mealPackageId: MealPackage | string;
  status: PurchaseStatus;
  requestedAt: string;
  processedAt?: string;
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
  userPackageId: string;
  orderType?: PackageType; // Loại đặt: có cơm hoặc không cơm
  isConfirmed: boolean;
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
  totalTransactions: number;
  breakdown: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
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
