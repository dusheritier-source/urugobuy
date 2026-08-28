import { ProductsSearchResults } from "./products-search-results";
import { products } from "@/lib/data";

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<{ category?: string; q?: string }> }) {
  const { category = "", q = "" } = searchParams ? await searchParams : {};
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-[0_30px_90px_-45px_rgba(139,69,19,0.3)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Shop everything</p>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">Premium products with effortless browsing</h1>
          </div>
        </div>
      </section>

      <ProductsSearchResults allProducts={products} initialCategory={category} initialQuery={q} />
    </main>
  );
}


