import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";
import { trackCommerceEvent } from "@/lib/analytics";

export interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        trackCommerceEvent("add_to_cart", { value: product.price * quantity, items: [{ item_id: product.id, item_name: product.title, quantity }] });
        return set((state) => {
          const maxStock = Math.max(product.stock ?? 0, 0);
          const safeQuantity = Math.min(Math.max(quantity, 0), maxStock);

          if (safeQuantity <= 0) {
            // Nothing to add when stock is 0.
            return state;
          }

          const existing = state.items.find((item) => item.id === product.id);
          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + safeQuantity,
              existing.stock ?? maxStock,
            );

            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: nextQuantity }
                  : item,
              ),
            };
          }

          return { items: [...state.items, { ...product, quantity: safeQuantity }] };
        });
      },

      removeItem: (id) => { trackCommerceEvent("remove_from_cart", { item_id: id }); return set((state) => ({ items: state.items.filter((item) => item.id !== id) })); },
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;

            const maxStock = Math.max(item.stock ?? 0, 0);
            const next = Math.max(quantity, 0);
            const clamped = Math.min(next, maxStock);
            return { ...item, quantity: clamped };
          }),
        })),

      clear: () => set({ items: [] }),
    }),
    { name: "urugo-cart" },
  ),
);
