"use client";

import type { Product } from "@/types";
import { relatedProducts } from "@/lib/recommendations";
import { RecommendationShelf } from "@/components/recommendations/product-shelf";
export function RelatedProducts({ currentProductId, products, limit = 4, currency = "USD", className }: { currentProductId: string; products: Product[]; limit?: number; currency?: string; className?: string }) {
  return <RecommendationShelf title="More to explore" description="Similar product types and more choices in this category." items={relatedProducts(products, currentProductId, limit)} currency={currency} className={className} />;
}
