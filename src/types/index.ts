export type Role = "GUEST" | "BUYER" | "FARMER" | "ADMIN";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
}

export interface FarmProfile {
  id: string;
  farmerId: string;
  farmName: string;
  description: string | null;
  coverImage: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  postalCode: string | null;
  openingTime: string | null;
  closingTime: string | null;
  phone: string | null;
  verified: boolean;
  ratingAverage: number;
  totalReviews: number;
  followers: number;
  images: { id: string; imageUrl: string }[];
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  unit: string;
  coverImage: string | null;
  description?: string;
  rating: number;
  sold: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  farm: {
    id: string;
    farmName: string;
    province: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  deliveryType: string;
  total: number;
  createdAt: Date;
  items: {
    id: string;
    product: { name: string; coverImage: string | null };
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  farm: { farmName: string };
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string | null;
  image: string | null;
  messageType: string;
  isRead: boolean;
  createdAt: Date;
  sender: { firstName: string; lastName: string };
}

export interface ConversationItem {
  id: string;
  buyerId: string;
  farmerId: string;
  lastMessage: string | null;
  lastMessageTime: Date | null;
  buyer: { firstName: string; lastName: string; avatar: string | null };
  farmer: { firstName: string; lastName: string; avatar: string | null };
  _count?: { messages: number };
}

export interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  images: string[] | null;
  farmerReply: string | null;
  createdAt: Date;
  buyer: { firstName: string; lastName: string; avatar: string | null };
}

export interface DashboardStats {
  farmName?: string;
  totalRevenue?: number;
  totalOrders?: number;
  totalProducts?: number;
  totalFarms?: number;
  totalUsers?: number;
  todaySales?: number;
  monthlySales?: number;
  pendingOrders?: number;
  lowStockProducts?: number;
  recentOrders?: OrderWithItems[];
  topProducts?: { id: string; name: string; sold: number; revenue: number }[];
  salesData?: { date: string; amount: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}
