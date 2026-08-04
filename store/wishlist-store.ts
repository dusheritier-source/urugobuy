import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types";

type WishlistStore = { items: Product[]; toggle: (product: Product) => void; has: (id: string) => boolean; clear: () => void };
export const useWishlistStore = create<WishlistStore>()(persist((set, get) => ({
  items: [],
  toggle: (product) => set((state) => ({ items: state.items.some((item) => item.id === product.id) ? state.items.filter((item) => item.id !== product.id) : [...state.items, product] })),
  has: (id) => get().items.some((item) => item.id === id),
  clear: () => set({ items: [] }),
}), { name: "urugo-wishlist" }));
