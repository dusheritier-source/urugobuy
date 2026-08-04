"use client";

import { products } from "@/lib/data";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface FrequentlyBoughtTogetherProps {
  currentProductId: string;
  className?: string;
}

export function FrequentlyBoughtTogether({ currentProductId, className }: FrequentlyBoughtTogetherProps) {
  // Get current product and suggest 2-3 complementary products
  const currentProduct = products.find((p) => p.id === currentProductId);
  const suggestedProducts = products
    .filter((p) => p.id !== currentProductId)
    .slice(0, 3);

  if (!currentProduct || suggestedProducts.length === 0) return null;

  const currentDiscount = currentProduct.discount || 0;
  const currentFinalPrice = currentProduct.price - (currentProduct.price * currentDiscount) / 100;

  const totalOriginal = suggestedProducts.reduce((sum, p) => sum + p.price, 0) + currentProduct.price;
  const totalDiscount = suggestedProducts.reduce((sum, p) => sum + (p.discount || 0), 0) + currentDiscount;
  const bundlePrice = totalOriginal - (totalOriginal * totalDiscount) / 100;

  return (
    <div className={cn("rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-sm", className)}>
      <h2 className="text-2xl font-semibold text-stone-900">Frequently Bought Together</h2>
      
      <div className="mt-6 space-y-4">
        {/* Current Product */}
        <div className="flex items-center gap-4 rounded-[20px] border border-stone-200/70 p-4">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-[16px]">
            <img
              src={currentProduct.images[0]}
              alt={currentProduct.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-stone-900">{currentProduct.title}</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#8B4513]">
                ${currentFinalPrice.toFixed(2)}
              </span>
              {currentDiscount > 0 && (
                <span className="text-sm text-stone-500 line-through">
                  ${currentProduct.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          <Checkbox checked disabled />
        </div>

        {/* Suggested Products */}
        {suggestedProducts.map((product) => {
          const discount = product.discount || 0;
          const finalPrice = product.price - (product.price * discount) / 100;

          return (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-[20px] border border-stone-200/70 p-4 transition hover:border-[#8B4513]"
            >
              <Checkbox />
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-[16px]">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-stone-900">{product.title}</h3>
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
            </div>
          );
        })}

        {/* Bundle Total */}
        <div className="rounded-[20px] bg-[#fff8f1] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-600">Bundle Price</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#8B4513]">
                  ${bundlePrice.toFixed(2)}
                </span>
                <span className="text-sm text-stone-500 line-through">
                  ${totalOriginal.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-green-600">
                You save ${(totalOriginal - bundlePrice).toFixed(2)} ({totalDiscount}% off)
              </p>
            </div>
            <button className="rounded-full bg-[#8B4513] px-6 py-3 font-semibold text-white transition hover:bg-[#6d3410]">
              Add Bundle to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}