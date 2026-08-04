import Image from "next/image";
import type { Category } from "@/types";

export function Categories({ categories }: { categories: Category[] }) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Featured categories</p>
          <h2 className="text-2xl font-semibold text-stone-900">Explore by lifestyle</h2>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <article key={category.id} className="overflow-hidden rounded-[28px] border border-stone-200/70 bg-white shadow-[0_20px_70px_-35px_rgba(15,23,42,0.28)]">
            <div className="relative aspect-[4/3]">
              <Image 
                src={category.image} 
                alt={category.name} 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover" 
              />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-stone-900">{category.name}</h3>
              <p className="mt-2 text-sm text-stone-600">{category.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
