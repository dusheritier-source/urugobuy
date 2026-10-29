"use client";

import Image from "next/image";
import { catalogImageUrl } from "@/lib/catalog-image.mjs";
import Link from "next/link";
import type { Route } from "next";
import type { Recommendation } from "@/lib/recommendations";
import { sellingPrice } from "@/lib/product-pricing";
import { useLocale } from "@/components/locale/locale-context";
import { cn } from "@/lib/utils";

export function RecommendationShelf({ title, description, items, currency = "USD", action, className }: {
  title: string; description?: string; items: Recommendation[]; currency?: string; action?: React.ReactNode; className?: string;
}) {
  const { locale } = useLocale();
  const format = (amount: number) => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);
  if (!items.length) return null;
  return <section aria-label={title} className={cn("rounded-[28px] border border-stone-200/70 bg-white p-4 sm:p-6 dark:border-white/10 dark:bg-slate-900", className)}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-stone-900 sm:text-2xl dark:text-white">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">{description}</p>}</div>{action}</div>
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{items.map(({ product, reason }) => <Link key={product.id} href={`/${locale}/products/${product.slug}` as Route} className="group overflow-hidden rounded-2xl border border-stone-200 transition hover:border-[#8B4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4513] dark:border-white/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-50"><Image src={catalogImageUrl(product.images[0])} alt={product.title} fill unoptimized sizes="(max-width: 640px) 45vw, 25vw" className="object-contain p-2 transition group-hover:scale-105" /></div>
      <div className="p-3"><p className="text-[10px] font-medium text-[#8B4513] dark:text-orange-300">{reason}</p><h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-stone-900 dark:text-stone-100">{product.title}</h3><p className="mt-2 text-sm font-bold text-stone-900 dark:text-white">{format(sellingPrice(product))}</p><p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{product.stock > 0 ? "In stock" : "Out of stock"}</p></div>
    </Link>)}</div>
  </section>;
}
