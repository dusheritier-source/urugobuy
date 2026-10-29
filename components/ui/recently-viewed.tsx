"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types";
import { useUIStore } from "@/store/ui-store";
import { recentlyViewedProducts } from "@/lib/recommendations";
import { RecommendationShelf } from "@/components/recommendations/product-shelf";

export function RecentlyViewed({ products, currentProductId, currency = "USD" }: { products: Product[]; currentProductId?: string; currency?: string }) {
  const [hydrated, setHydrated] = useState(false);
  const history = useUIStore((state) => state.recentlyViewed);
  const clear = useUIStore((state) => state.clearRecentlyViewed);
  useEffect(() => { setHydrated(true); }, []);
  if (!hydrated) return null;
  const viewed = recentlyViewedProducts(products, Array.isArray(history) ? history : [], currentProductId);
  return <RecommendationShelf title="Recently viewed" description="Pick up where you left off. This history stays in this browser." items={viewed.map((product) => ({ product, reason: "You viewed this product" }))} currency={currency} action={<button type="button" onClick={clear} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold transition hover:border-[#8B4513] dark:border-white/20">Clear browsing history</button>} />;
}
