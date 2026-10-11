import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
    lastName: z.string().min(2, "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร"),
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string(),
    phone: z.string().optional(),
    role: z.enum(["BUYER", "FARMER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export const productSchema = z.object({
  name: z.string().min(2, "ชื่อสินค้าต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().optional(),
  price: z.coerce.number().positive("ราคาต้องมากกว่า 0"),
  stock: z.coerce.number().int().nonnegative(),
  unit: z.string().default("kg"),
  weight: z.coerce.number().positive().optional(),
  categoryId: z.string().uuid(),
  pickupAvailable: z.boolean().default(false),
  deliveryAvailable: z.boolean().default(true),
});

export const farmSchema = z.object({
  farmName: z.string().min(2, "ชื่อสวนต้องมีอย่างน้อย 2 ตัวอักษร"),
  description: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  subdistrict: z.string().optional(),
  postalCode: z.string().optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  phone: z.string().optional(),
});

export const orderSchema = z.object({
  deliveryType: z.enum(["ONLINE", "PICKUP"]),
  addressId: z.string().uuid().optional(),
  remark: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
});

export const reviewSchema = z.object({
  productId: z.string().uuid(),
  farmId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export const profileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.string().optional(),
});

export const addressSchema = z.object({
  label: z.string().optional(),
  address: z.string().min(5, "ที่อยู่ต้องมีอย่างน้อย 5 ตัวอักษร"),
  province: z.string().min(2),
  district: z.string().min(2),
  subdistrict: z.string().min(2),
  postalCode: z.string().min(5),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});
