import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Promotion = { id: string; code: string; kind: "percentage" | "fixed"; value: number; minimum: number; startsAt: string; endsAt: string; usageLimit: number; uses: number; active: boolean };
const initial: Promotion[] = [
  { id: "welcome", code: "WELCOME10", kind: "percentage", value: 10, minimum: 0, startsAt: "2026-01-01", endsAt: "2027-12-31", usageLimit: 1000, uses: 0, active: true },
  { id: "urugo", code: "URUGO15", kind: "percentage", value: 15, minimum: 100, startsAt: "2026-01-01", endsAt: "2027-12-31", usageLimit: 500, uses: 0, active: true },
];
type Store = { promotions: Promotion[]; save: (promotion: Promotion) => void; remove: (id: string) => void; redeem: (id: string) => void };
export const usePromotionStore = create<Store>()(persist((set) => ({ promotions: initial, save: (promotion) => set((state) => ({ promotions: state.promotions.some((p) => p.id === promotion.id) ? state.promotions.map((p) => p.id === promotion.id ? promotion : p) : [promotion, ...state.promotions] })), remove: (id) => set((state) => ({ promotions: state.promotions.filter((p) => p.id !== id) })), redeem: (id) => set((state) => ({ promotions: state.promotions.map((p) => p.id === id ? { ...p, uses: p.uses + 1 } : p) })) }), { name: "urugo-promotions" }));
export function promotionDiscount(promotion: Promotion | undefined, subtotal: number) { if (!promotion || !promotion.active || promotion.uses >= promotion.usageLimit || subtotal < promotion.minimum) return 0; const now = Date.now(); if (now < Date.parse(promotion.startsAt) || now > Date.parse(promotion.endsAt)) return 0; return promotion.kind === "percentage" ? promotion.value : subtotal ? Math.min(100, promotion.value / subtotal * 100) : 0; }
