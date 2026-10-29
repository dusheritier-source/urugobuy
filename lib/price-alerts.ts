import { z } from "zod";
import { sellingPrice } from "./product-pricing.mjs";

export const priceAlertId = z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export const priceAlertInput = z.object({ productId: priceAlertId, targetPrice: z.number().finite().min(0).max(100_000_000).nullable().default(null), emailEnabled: z.boolean().default(false) }).strict();
export const cancelPriceAlertInput = z.object({ productId: priceAlertId }).strict();
export const readPriceAlertsInput = z.object({ notificationIds: z.array(priceAlertId).min(1).max(50) }).strict();

export type PriceAlert = {
  productId: string; productTitle: string; productSlug: string; priceAtSubscription: number; targetPrice: number | null;
  currency: string; active: boolean; emailEnabled: boolean; createdAt: string; lastNotifiedPrice?: number | null;
  currentPrice?: number | null; stock?: number; available?: boolean;
};
export type PriceNotification = { id: string; productId: string; productTitle: string; productSlug: string; oldPrice: number; newPrice: number; currency: string; createdAt: string; read: boolean };

const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0;
export function eligiblePriceDrop(alert: Record<string, unknown>, product: Record<string, unknown>, currency: string) {
  if (alert.active !== true || product.status !== "published" || !Number.isInteger(product.stock) || Number(product.stock) < 1) return null;
  if (alert.currency && alert.currency !== currency) return null;
  if (!amount(product.price) || !amount(product.discount ?? 0) || Number(product.discount ?? 0) > 100) return null;
  const baseline = amount(alert.lastNotifiedPrice) ? Number(alert.lastNotifiedPrice) : Number(alert.priceAtSubscription);
  const currentPrice = sellingPrice({ price: product.price, discount: product.discount ?? 0 });
  if (!Number.isFinite(baseline) || baseline < 0 || Math.round(currentPrice * 100) >= Math.round(baseline * 100)) return null;
  if (alert.targetPrice != null && (!amount(alert.targetPrice) || currentPrice > Number(alert.targetPrice))) return null;
  return { oldPrice: baseline, newPrice: currentPrice };
}
export function needsPriceAlertEvent(previous: Record<string, unknown>, updated: Record<string, unknown>) {
  if (updated.status !== "published") return false;
  const price = sellingPrice({ price: Number(updated.price), discount: Number(updated.discount ?? 0) });
  const old = sellingPrice({ price: Number(previous.price), discount: Number(previous.discount ?? 0) });
  return Number.isFinite(price) && price >= 0 && (price < old || (Number(updated.stock) > 0 && Number(previous.stock) <= 0) || previous.status !== "published");
}
