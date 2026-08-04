"use client";

import { products } from "@/lib/data";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RelatedProductsProps {
  currentProductId: string;
  category?: string;
  limit?: number;
  className?: string;
}

export function RelatedProducts({ currentProductId, category, limit = 4, className }: RelatedProductsProps) {
  // Filter products by category and exclude current product
  const related = products
    .filter((product) => product.id !== currentProductId)
    .filter((product) => !category || product.category === category)
    .slice(0, limit);

  if (related.length === 0) return null;

  return (
    <div className={cn("rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-sm", className)}>
      <h2 className="text-2xl font-semibold text-stone-900">Related Products</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => {
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
                <div className="mt-1 flex items-center gap-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-stone-300 text-stone-300"
                        )}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-stone-600">({product.rating})</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}