"use client";

import { useUIStore } from "@/store/ui-store";
import { products } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function RecentlyViewed() {
  const { recentlyViewed } = useUIStore();

  if (recentlyViewed.length === 0) return null;

  const viewedProducts = products.filter((product) =>
    recentlyViewed.includes(product.id)
  );

  return (
    <div className="rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-stone-900">Recently Viewed</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {viewedProducts.map((product) => {
          const discount = product.discount || 0;
          const finalPrice = product.price - (product.price * discount) / 100;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-[20px] border border-stone-200/70 p-3 transition hover:border-[#8B4513] hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden rounded-[16px]">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-medium text-stone-900 line-clamp-1">
                  {product.title}
                </h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-bold text-[#8B4513]">
                    ${finalPrice.toFixed(2)}
                  </span>
                  {discount > 0 && (
                    <span className="text-sm text-stone-500 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}