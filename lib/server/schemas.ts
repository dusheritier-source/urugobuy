import { z } from "zod";

const shortText = z.string().trim().min(1).max(200);
const isoDate = z.string().datetime();

export const productSchema = z.object({
  title: shortText,
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1).max(10_000),
  category: shortText,
  brand: shortText,
  price: z.number().finite().nonnegative().max(100_000_000),
  discount: z.number().finite().min(0).max(100),
  images: z.array(z.string().url()).min(1).max(12),
  rating: z.number().finite().min(0).max(5).default(0),
  stock: z.number().int().min(0).max(1_000_000),
  colors: z.array(shortText).max(50),
  sizes: z.array(shortText).max(50),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().trim().min(7).max(30),
  line1: z.string().trim().min(3).max(200),
  city: shortText,
  province: shortText,
  country: z.string().trim().min(2).max(80),
});

export const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  lines: z.array(z.object({ productId: z.string().trim().min(1).max(128), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
  address: addressSchema,
  shippingMethod: z.enum(["standard", "express", "pickup"]),
  paymentMethod: z.enum(["card", "mobile_money", "cash_on_delivery"]),
  coupon: z.string().trim().max(50).optional(),
  note: z.string().trim().max(1_000).optional(),
});

export const updateOrderSchema = z.object({
  status: z.enum(["processing", "shipped", "delivered"]),
  trackingNumber: z.string().trim().max(120).optional(),
  carrier: z.string().trim().max(120).optional(),
  note: z.string().trim().max(1_000).optional(),
}).refine((value) => value.status !== "shipped" || Boolean(value.trackingNumber), { message: "Tracking number is required when shipping", path: ["trackingNumber"] });

export const reviewSchema = z.object({
  productId: z.string().trim().min(1).max(128),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  comment: z.string().trim().min(10).max(3_000),
});

export const createReturnSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  productIds: z.array(z.string().trim().min(1).max(128)).min(1).max(50),
  reason: z.string().trim().min(10).max(2_000),
  resolution: z.enum(["refund", "replacement", "store_credit"]),
});

export const updateReturnSchema = z.object({
  status: z.enum(["approved", "received", "resolved", "rejected"]),
  staffNote: z.string().trim().max(2_000).optional(),
});

export const promotionSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/),
  kind: z.enum(["percentage", "fixed"]),
  value: z.number().finite().positive(),
  minimum: z.number().finite().nonnegative(),
  startsAt: isoDate,
  endsAt: isoDate,
  usageLimit: z.number().int().positive(),
  active: z.boolean(),
}).refine((value) => Date.parse(value.endsAt) > Date.parse(value.startsAt), { message: "End date must be after start date", path: ["endsAt"] });
