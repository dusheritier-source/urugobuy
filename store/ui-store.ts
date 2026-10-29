import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface UIStore {
  // Toast notifications
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;

  // Recently viewed products
  recentlyViewed: string[];
  addToRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;

  // Comparison list
  compareList: string[];
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;

  // Mobile menu
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // Toast notifications
      toasts: [],
      addToast: (message, type = "info") =>
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id: Date.now().toString(), message, type },
          ],
        })),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),

      // Recently viewed products
      recentlyViewed: [],
      addToRecentlyViewed: (productId) =>
        set((state) => {
          const filtered = (Array.isArray(state.recentlyViewed) ? state.recentlyViewed : []).filter((id) => typeof id === "string" && id !== productId);
          return {
            recentlyViewed: [productId, ...filtered].slice(0, 10),
          };
        }),

      // Comparison list
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),

      compareList: [],
      addToCompare: (productId) =>
        set((state) => {
          if (state.compareList.includes(productId)) return state;
          if (state.compareList.length >= 4) return state;
          return {
            compareList: [...state.compareList, productId],
          };
        }),
      removeFromCompare: (productId) =>
        set((state) => ({
          compareList: state.compareList.filter((id) => id !== productId),
        })),
      clearCompare: () => set({ compareList: [] }),

      // Mobile menu
      isMobileMenuOpen: false,
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),

      // Search
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),
      recentSearches: [],
      addRecentSearch: (query) =>
        set((state) => {
          const filtered = state.recentSearches.filter((q) => q !== query);
          return {
            recentSearches: [query, ...filtered].slice(0, 10),
          };
        }),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        recentlyViewed: state.recentlyViewed,
        compareList: state.compareList,
        recentSearches: state.recentSearches,
      }),
    }
  )
);