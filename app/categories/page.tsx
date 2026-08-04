import { categories } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CategoriesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Categories</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Shop by lifestyle</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${encodeURIComponent(category.name)}`} className="group overflow-hidden rounded-[28px] border border-stone-200/70 bg-white shadow-sm">
              <div className="relative aspect-[16/8] overflow-hidden"><Image src={category.image} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-6"><h2 className="text-xl font-semibold text-stone-900">{category.name}</h2><p className="mt-2 text-sm text-stone-600">{category.description}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#8B4513]">Shop category <ArrowRight size={16} /></span></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
