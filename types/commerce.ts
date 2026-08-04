import type { Product } from "@/types";

export type PaymentMethod = "card" | "mobile_money" | "cash_on_delivery";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type CheckoutAddress = { fullName: string; email: string; phone: string; line1: string; city: string; province: string; country: string };
export type OrderLine = Pick<Product, "id" | "slug" | "title" | "images" | "price" | "discount"> & { quantity: number; unitPrice: number };
export type Order = { id: string; orderNumber: string; idempotencyKey: string; customerId: string | null; createdAt: string; updatedAt: string; status: OrderStatus; paymentStatus: PaymentStatus; paymentMethod: PaymentMethod; address: CheckoutAddress; shippingMethod: "standard" | "express" | "pickup"; lines: OrderLine[]; subtotal: number; discount: number; tax: number; shipping: number; total: number; coupon?: string; trackingNumber?: string; note?: string };
