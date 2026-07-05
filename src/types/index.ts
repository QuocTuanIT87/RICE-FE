// Shared TypeScript types cho frontend

// User types
export type UserRole = "admin" | "user";
export interface VipCosmetics {
  vipTheme: string;
  vipAvatarFrame: string;
  vipCoverImage: string;
  vipMascot: string;
  vipWebsiteName: string;
  vipWebsiteLogo: string;
  vipWebsiteBanner: string;
}

export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked?: boolean;
  balance?: number; // Số dư tiền ví VND (mới)
  totalSpent?: number; // Tổng chi tiêu tích lũy
  vipLevelCode?: string; // normal, silver, gold, diamond
  vipLevelName?: string; // Tên hạng VIP
  vipDiscountRate?: number; // Phần tích giảm giá VIP / Số tiền giảm cứng của gói VIP
  vipCosmetics?: VipCosmetics;
  hasMembership?: boolean;
  membershipName?: string;
  membershipExpiresAt?: string | null;
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

export interface VipPackage {
  _id: string;
  name: string;
  price: number;
  discountAmount: number;
  validDays: number;
  isActive: boolean;
  features: string[];
}

export interface UserMembership {
  _id: string;
  userId: string;
  vipPackageId: VipPackage | string;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface ForumReaction {
  userId: string;
  type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
}

export interface ForumPost {
  _id: string;
  title: string;
  content: string;
  category: string;
  userId: User;
  likes: string[];
  reactions?: ForumReaction[];
  commentsCount?: number;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ForumComment {
  _id: string;
  postId: string;
  userId: User;
  content: string;
  parentId?: string | null;
  reactions?: ForumReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface ForumStory {
  _id: string;
  userId: User;
  imageUrl: string;
  caption?: string;
  musicTitle?: string;
  musicUrl?: string;
  views?: User[];
  createdAt: string;
  expiresAt: string;
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
  requestType?: string;
  vipPackageId?: string | any;
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
  restaurantBankId?: string;
  restaurantBankAccountNo?: string;
  restaurantBankAccountName?: string;
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

export interface Notification {
  _id: string;
  userId: string | null; // null means public broadcast
  title: string;
  content: string;
  type: "system" | "gift" | "alert";
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FriendStatus = "none" | "pending_sent" | "pending_received" | "friends";

export interface PublicProfile {
  user: User;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  friendStatus: FriendStatus;
  isFollowing: boolean;
  isBlockedByMe?: boolean;
  isBlockedByThem?: boolean;
  recentPosts: ForumPost[];
}

export interface MessageReaction {
  userId: string;
  type: "like" | "love" | "haha" | "wow" | "sad" | "angry";
}

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  imageUrl?: string;
  isRead: boolean;
  isRecalled: boolean;
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  otherUser: User;
  lastMessage: Message;
  unreadCount: number;
}

