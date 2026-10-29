"use client";

import { useEffect } from "react";
import type { Product } from "@/types";
import { useUIStore } from "@/store/ui-store";
import { RelatedProducts } from "@/components/ui/related-products";
import { RecentlyViewed } from "@/components/ui/recently-viewed";
import { FrequentlyBoughtTogether } from "@/components/ui/frequently-bought-together";

export function ProductRecommendations({ productId, products, currency = "USD" }: { productId: string; products: Product[]; currency?: string }) {
  const remember = useUIStore((state) => state.addToRecentlyViewed);
  useEffect(() => { remember(productId); }, [productId, remember]);
  return <div className="mt-10 space-y-6">
    <FrequentlyBoughtTogether currentProductId={productId} products={products} currency={currency} />
    <RelatedProducts currentProductId={productId} products={products} currency={currency} />
    <RecentlyViewed products={products} currentProductId={productId} currency={currency} />
  </div>;
}
