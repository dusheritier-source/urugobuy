import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/types";
import { ProductGridQuickView } from "./product-grid-quickview";

export function ProductGrid({ products, title }: { products: Product[]; title: string }) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">{title}</p>
          <h2 className="text-xl font-semibold leading-tight text-stone-900 sm:text-2xl">Curated picks for modern living</h2>
        </div>
        <Link href="/products" aria-label="View all products" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff3e5] text-[#8B4513] sm:h-auto sm:w-auto sm:bg-transparent sm:text-sm sm:font-semibold sm:hover:underline">
          <span className="hidden sm:inline">View all</span> <ArrowRight className="sm:ml-1" size={18} />
        </Link>
      </div>
      <ProductGridQuickView products={products} />
    </section>
  );
}

