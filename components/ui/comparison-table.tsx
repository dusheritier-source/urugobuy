"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { Product } from "@/types";

export function ComparisonTable() {
  const { compareList, removeFromCompare, clearCompare } = useUIStore();
  const [products, setProducts] = useState<Product[]>([]);

  // In a real app, you'd fetch products based on compareList
  // For now, we'll use placeholder data
  useEffect(() => {
    // Fetch products logic here
  }, [compareList]);

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">
          Compare ({compareList.length}/4)
        </h3>
        <button
          onClick={clearCompare}
          className="text-sm text-stone-600 transition hover:text-[#8B4513]"
        >
          Clear all
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {compareList.map((productId) => (
          <div
            key={productId}
            className="flex items-center justify-between rounded-lg border border-stone-200 p-2"
          >
            <span className="text-sm text-stone-700">Product {productId}</span>
            <button
              onClick={() => removeFromCompare(productId)}
              className="rounded-full p-1 text-stone-600 transition hover:bg-stone-100 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        className={cn(
          "mt-4 w-full rounded-full py-2 font-semibold transition",
          compareList.length >= 2
            ? "bg-[#8B4513] text-white hover:bg-[#6d3410]"
            : "bg-stone-200 text-stone-400 cursor-not-allowed"
        )}
        disabled={compareList.length < 2}
      >
        Compare Now
      </button>
    </div>
  );
}