import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Star } from "lucide-react";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductGridQuickView } from "./product-grid-quickview";

export function ProductGrid({ products, title }: { products: Product[]; title: string }) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">{title}</p>
          <h2 className="text-2xl font-semibold text-stone-900">Curated picks for modern living</h2>
        </div>
        <Link href="/products" className="text-sm font-semibold text-[#8B4513] hover:underline">
          View all <ArrowRight className="ml-1 inline" size={16} />
        </Link>
      </div>
      <ProductGridQuickView products={products} title={title} />
    </section>
  );
}

