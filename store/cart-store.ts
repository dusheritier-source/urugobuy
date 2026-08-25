import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";
import { trackCommerceEvent } from "@/lib/analytics";

export interface CartItem extends Product {
  quantity: number;
}

export type CartMutation = { requested: number; accepted: number; reason: "added" | "clamped" | "out_of_stock" | "unchanged" };
export type CartNotice = { id: string; message: string };

interface CartStore {
  items: CartItem[];
  notice: CartNotice | null;
  addItem: (product: Product, quantity?: number) => CartMutation;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => CartMutation;
  reconcileStock: (stock: Array<{ id: string; stock: number; price?: number | null; discount?: number | null }>) => void;
  clearNotice: () => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      notice: null,
      addItem: (product, quantity = 1) => {
        const requested = Math.max(0, Math.floor(quantity));
        const maxStock = Math.max(0, Math.floor(product.stock ?? 0));
        const existing = get().items.find((item) => item.id === product.id);
        const available = Math.max(0, maxStock - (existing?.quantity ?? 0));
        const accepted = Math.min(requested, available);
        if (accepted <= 0) {
          const reason = maxStock === 0 ? "out_of_stock" : "unchanged";
          set({ notice: { id: crypto.randomUUID(), message: maxStock === 0 ? `${product.title} is out of stock.` : `Only ${maxStock} ${product.title} can be added.` } });
          return { requested, accepted: 0, reason };
        }
        set((state) => ({
          items: existing
            ? state.items.map((item) => item.id === product.id ? { ...item, ...product, quantity: item.quantity + accepted } : item)
            : [...state.items, { ...product, quantity: accepted }],
          notice: accepted < requested ? { id: crypto.randomUUID(), message: `Only ${accepted} of ${requested} requested ${product.title} were added.` } : null,
        }));
        trackCommerceEvent("add_to_cart", { value: product.price * accepted, items: [{ item_id: product.id, item_name: product.title, quantity: accepted }] });
        return { requested, accepted, reason: accepted < requested ? "clamped" : "added" };
      },

      removeItem: (id) => { trackCommerceEvent("remove_from_cart", { item_id: id }); return set((state) => ({ items: state.items.filter((item) => item.id !== id) })); },
      updateQuantity: (id, quantity) => {
        const item = get().items.find((entry) => entry.id === id);
        const requested = Math.max(0, Math.floor(quantity));
        if (!item) return { requested, accepted: 0, reason: "unchanged" };
        const accepted = Math.min(requested, Math.max(0, item.stock));
        set((state) => ({ items: state.items.map((entry) => entry.id === id ? { ...entry, quantity: accepted } : entry), notice: accepted < requested ? { id: crypto.randomUUID(), message: `${item.title} was limited to ${accepted} because of available stock.` } : null }));
        return { requested, accepted, reason: accepted < requested ? "clamped" : "added" };
      },

      reconcileStock: (updates) => set((state) => {
        const byId = new Map(updates.map((entry) => [entry.id, { ...entry, stock: Math.max(0, Math.floor(entry.stock)) }]));
        const messages: string[] = [];
        const items = state.items.flatMap((item) => {
          const current = byId.get(item.id);
          if (current == null) return [item];
          if (current.stock === 0) { messages.push(`${item.title} is now out of stock and was removed from your cart.`); return []; }
          if (item.quantity > current.stock) messages.push(`${item.title} was reduced from ${item.quantity} to ${current.stock}.`);
          if (current.price != null && (current.price !== item.price || (current.discount ?? 0) !== item.discount)) messages.push(`${item.title} pricing was updated.`);
          return [{ ...item, stock: current.stock, quantity: Math.min(item.quantity, current.stock), price: current.price ?? item.price, discount: current.discount ?? item.discount }];
        });
        return { items, notice: messages.length ? { id: crypto.randomUUID(), message: messages.join(" ") } : state.notice };
      }),
      clearNotice: () => set({ notice: null }),

      clear: () => set({ items: [], notice: null }),
    }),
    { name: "urugo-cart", partialize: (state) => ({ items: state.items }) },
  ),
);
