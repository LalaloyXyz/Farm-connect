export const APP_NAME = "FarmConnect";
export const APP_DESCRIPTION = "ตลาดซื้อขายสินค้าเกษตรออนไลน์ เชื่อมต่อเกษตรกรกับผู้บริโภคโดยตรง";

export const ROLES = {
  GUEST: "GUEST",
  BUYER: "BUYER",
  FARMER: "FARMER",
  ADMIN: "ADMIN",
} as const;

export const ORDER_STATUS = {
  PENDING: "PENDING",
  WAITING_PAYMENT: "WAITING_PAYMENT",
  PAID: "PAID",
  PREPARING: "PREPARING",
  SHIPPING: "SHIPPING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "รอการยืนยัน",
  WAITING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PREPARING: "กำลังเตรียมสินค้า",
  SHIPPING: "กำลังจัดส่ง",
  READY_FOR_PICKUP: "พร้อมรับสินค้า",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  REFUNDED: "คืนเงิน",
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  WAITING_PAYMENT: "bg-orange-100 text-orange-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-indigo-100 text-indigo-800",
  SHIPPING: "bg-purple-100 text-purple-800",
  READY_FOR_PICKUP: "bg-teal-100 text-teal-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export const DELIVERY_TYPE = {
  ONLINE: "ONLINE",
  PICKUP: "PICKUP",
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  HIDDEN: "HIDDEN",
} as const;

export const DISTANCE_OPTIONS = [
  { label: "1 กม.", value: 1 },
  { label: "3 กม.", value: 3 },
  { label: "5 กม.", value: 5 },
  { label: "10 กม.", value: 10 },
  { label: "25 กม.", value: 25 },
  { label: "50 กม.", value: 50 },
  { label: "100 กม.", value: 100 },
  { label: "200 กม.", value: 200 },
  { label: "500 กม.", value: 500 },
  { label: "ทุกพื้นที่", value: 0 },
];

export const SORT_OPTIONS = [
  { label: "ล่าสุด", value: "newest" },
  { label: "ยอดนิยม", value: "popular" },
  { label: "ราคาต่ำไปสูง", value: "price_asc" },
  { label: "ราคาสูงไปต่ำ", value: "price_desc" },
  { label: "คะแนนสูงสุด", value: "rating" },
  { label: "ใกล้ที่สุด", value: "distance" },
];

export const RATE_LIMITS = {
  LOGIN: { MAX: 10, WINDOW: 10 * 60 * 1000 },
  REGISTER: { MAX: 5, WINDOW: 60 * 60 * 1000 },
  AI_CHAT: { MAX: 20, WINDOW: 24 * 60 * 60 * 1000 },
  SEARCH: { MAX: 120, WINDOW: 60 * 1000 },
  CHAT: { MAX: 60, WINDOW: 60 * 1000 },
};
