"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { Heart, Star } from "lucide-react";
import type { Product } from "@/types";
import { QuickViewModal } from "@/components/ui/quick-view-modal";
import { useCartStore } from "@/store/cart-store";
import { useLocale } from "@/components/locale/locale-context";

export function ProductsPageGridQuickView({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { locale } = useLocale();

  const open = (p: Product) => {
    setSelected(p);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-[28px] border border-stone-200/70 bg-white shadow-[0_20px_70px_-35px_rgba(15,23,42,0.28)]"
          >
            <button
              type="button"
              onClick={() => open(product)}
              className="block w-full text-left"
              aria-label={`Quick view: ${product.title}`}
            >
              <div className="relative aspect-[4/3]">
                <Image src={product.images[0]} alt={product.title} fill unoptimized className="object-cover" />
              </div>
            </button>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.26em] text-[#FF8C00]">{product.brand}</span>
                <span className="rounded-full bg-[#fff8f1] px-3 py-1 text-xs font-semibold text-[#8B4513]">{product.category}</span>
              </div>

              <button
                type="button"
                onClick={() => open(product)}
                className="mt-3 block w-full text-left"
              >
                <h3 className="text-lg font-semibold text-stone-900">{product.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-stone-600">{product.description}</p>
              </button>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold text-stone-900">${product.price}</p>
                  <p className="text-sm text-stone-500">{product.stock} in stock</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addItem(product, 1)}
                    className="rounded-full border border-stone-200 px-3 py-2 text-sm font-semibold text-[#8B4513] transition hover:border-[#8B4513] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {product.stock > 0 ? "Add" : "Sold out"}
                  </button>
                  <button
                    type="button"
                    onClick={() => open(product)}
                    className="rounded-full border border-stone-200 p-2 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513]"
                    aria-label="Open quick view"
                  >
                    <Heart size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-amber-500">
                  <Star size={14} fill="currentColor" /> {product.rating}
                </div>
                <Link href={`/${locale}/products/${product.slug}` as Route} className="text-sm font-semibold text-[#8B4513] hover:underline">
                  Details →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}


