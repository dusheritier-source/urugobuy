import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order } from "@/types/commerce";

type OrderStore = { orders: Order[]; place: (order: Order) => Order; update: (id: string, values: Partial<Pick<Order, "status" | "paymentStatus" | "trackingNumber" | "note">>) => void };
export const useOrderStore = create<OrderStore>()(persist((set, get) => ({
  orders: [],
  place: (order) => { const existing = get().orders.find((item) => item.idempotencyKey === order.idempotencyKey); if (existing) return existing; set((state) => ({ orders: [order, ...state.orders] })); return order; },
  update: (id, values) => set((state) => ({ orders: state.orders.map((order) => order.id === id ? { ...order, ...values, updatedAt: new Date().toISOString() } : order) })),
}), { name: "urugo-orders" }));
