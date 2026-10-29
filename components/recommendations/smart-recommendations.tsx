"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import { personalizedProducts } from "@/lib/recommendations";
import { RecommendationShelf } from "@/components/recommendations/product-shelf";
import { RecentlyViewed } from "@/components/ui/recently-viewed";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
const EMPTY: string[] = [];

export function SmartRecommendations({ products, currency = "USD" }: { products: Product[]; currency?: string }) {
  const [hydrated, setHydrated] = useState(false);
  const storedHistory = useUIStore((state) => state.recentlyViewed);
  const cart = useCartStore((state) => state.items);
  useEffect(() => { setHydrated(true); }, []);
  const history = hydrated && Array.isArray(storedHistory) ? storedHistory : EMPTY;
  const items = useMemo(() => personalizedProducts(products, history, hydrated && Array.isArray(cart) ? cart.map((item) => item.id) : EMPTY, 4), [products, history, cart, hydrated]);
  return <div className="space-y-6">
    <RecommendationShelf title={history.length ? "Picked for your browsing" : "Discover our top-rated picks"} description={history.length ? "A few more ideas inspired by products you explored." : "Start exploring with highly rated, available products."} items={items} currency={currency} />
    <RecentlyViewed products={products} currency={currency} />
  </div>;
}
