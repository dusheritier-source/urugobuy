import type { CartItem } from "@/store/cart-store";

export const COUPONS: Record<string, number> = { WELCOME10: 10, URUGO15: 15 };
export function calculateCheckout(items: CartItem[], taxRate: number, shippingMethod: "standard" | "express" | "pickup", coupon = "", overrideDiscountRate?: number) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * (1 - item.discount / 100)) * item.quantity, 0);
  const discountRate = overrideDiscountRate ?? COUPONS[coupon.toUpperCase()] ?? 0;
  const discount = subtotal * discountRate / 100;
  const taxable = Math.max(0, subtotal - discount);
  const baseShipping = shippingMethod === "pickup" ? 0 : shippingMethod === "express" ? 30 : subtotal >= 100 ? 0 : 15;
  const tax = taxable * taxRate;
  return { subtotal, discount, tax, shipping: baseShipping, total: taxable + tax + baseShipping, discountRate };
}
