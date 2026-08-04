"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { QuickViewModal } from "@/components/ui/quick-view-modal";
import { useCartStore } from "@/store/cart-store";
import { useLocale } from "@/components/locale/locale-context";


export function ProductGridQuickView({
  products,
  title,
}: {
  products: Product[];
  title: string;
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
      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">
              {title}
            </p>
            <h2 className="text-2xl font-semibold text-stone-900">
              Curated picks for modern living
            </h2>
          </div>
          <a
            href={`/${useLocale().locale}/products`}
            className="text-sm font-semibold text-[#8B4513] hover:underline"
          >
            View all
          </a>

        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-[28px] border border-stone-200/70 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]"
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
                  className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-stone-700 shadow transition hover:border-[#8B4513] hover:text-[#8B4513]"
                  aria-label="Open quick view"
                >
                  <Heart size={18} />
                </button>
              </div>

              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#fff8f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#8B4513]">
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
                  <h3 className="text-lg font-semibold text-stone-900">
                    {product.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                    {product.description}
                  </p>
                </button>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-semibold text-stone-900">
                      ${product.price}
                    </p>
                    <p className="text-sm text-stone-500">{product.stock} left</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => addItem(product, 1)}
                  >
                    Add to cart
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

