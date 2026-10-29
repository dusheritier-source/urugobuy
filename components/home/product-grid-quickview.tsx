"use client";
import { sellingPrice } from "@/lib/product-pricing";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { QuickViewModal } from "@/components/ui/quick-view-modal";
import { useCartStore } from "@/store/cart-store";


export function ProductGridQuickView({
  products,
}: {
  products: Product[];
}) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const open = (p: Product) => {
    setSelected(p);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    // Keep selected for smoother UX; safe to clear later if desired
  };

  const modal = useMemo(() => {
    return (
      <QuickViewModal
        product={selected}
        isOpen={isOpen}
        onClose={close}
      />
    );
  }, [selected, isOpen]);

  return (
    <>
      {modal}
      <div className="grid gap-3 min-[480px]:grid-cols-2 md:gap-5 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-[22px] border border-[#eadfd4] bg-[var(--mobile-surface)] shadow-[0_20px_55px_-40px_rgba(113,55,15,0.4)] sm:rounded-[28px] sm:border-stone-200/70 sm:bg-white sm:shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <button
                  type="button"
                  onClick={() => open(product)}
                  className="block h-full w-full"
                  aria-label={`Quick view: ${product.title}`}
                >
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => open(product)}
                  className="absolute right-2.5 top-2.5 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-stone-700 shadow transition hover:border-[#8B4513] hover:text-[#8B4513] sm:right-4 sm:top-4"
                  aria-label="Open quick view"
                >
                  <Heart size={18} />
                </button>
              </div>

              <div className="space-y-3 p-3.5 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <span className="max-w-[70%] truncate rounded-full bg-[#fff8f1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B4513] sm:px-3 sm:text-xs sm:tracking-[0.25em]">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-amber-500">
                    <Star size={14} fill="currentColor" /> {product.rating}
                  </div>
                </div>

                <button
                  onClick={() => open(product)}
                  className="block text-left"
                >
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug text-stone-900 sm:text-lg">
                    {product.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                    {product.description}
                  </p>
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-stone-900">
                      ${sellingPrice(product).toFixed(2)}
                    </p>
                    <p className="text-sm text-stone-500">{product.stock} left</p>
                  </div>
                  <Button className="min-h-11 w-full sm:w-auto"
                    variant="outline"
                    disabled={product.stock <= 0}
                    onClick={() => addItem(product, 1)}
                  >
                    {product.stock > 0 ? "Add to cart" : "Out of stock"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
      </div>
    </>
  );
}

