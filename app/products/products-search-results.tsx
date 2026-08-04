"use client";

import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { ProductsPageGridQuickView } from "./product-grid-quickview";
import { readCatalog } from "@/lib/catalog-storage";

type SortKey = "featured" | "newest" | "rating" | "price-asc" | "price-desc";

export function ProductsSearchResults({ allProducts, initialCategory = "", initialQuery = "" }: { allProducts: Product[]; initialCategory?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [categories, setCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [brands, setBrands] = useState<string[]>([]);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(() => Math.ceil(Math.max(...allProducts.map((p) => p.price), 0)));
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [catalog, setCatalog] = useState(allProducts);
  useEffect(() => { const refresh = () => setCatalog(readCatalog(allProducts)); refresh(); window.addEventListener("urugo:catalog-change", refresh); return () => window.removeEventListener("urugo:catalog-change", refresh); }, [allProducts]);

  const categoryOptions = useMemo(() => [...new Set(catalog.map((p) => p.category))].sort(), [catalog]);
  const brandOptions = useMemo(() => [...new Set(catalog.map((p) => p.brand))].sort(), [catalog]);
  const catalogMaxPrice = useMemo(() => Math.ceil(Math.max(...catalog.map((p) => p.price), 0)), [catalog]);
  const activeCount = categories.length + brands.length + Number(inStock) + Number(minRating > 0) + Number(maxPrice < catalogMaxPrice);
  const suggestions = useMemo(() => query.trim().length < 2 ? [] : catalog.filter((p) => `${p.title} ${p.brand} ${p.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5), [catalog, query]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = catalog.filter((product) => {
      const matchesQuery = !normalized || [product.title, product.brand, product.category, product.description]
        .some((value) => value.toLowerCase().includes(normalized));
      return matchesQuery &&
        (!categories.length || categories.includes(product.category)) &&
        (!brands.length || brands.includes(product.brand)) &&
        (!inStock || product.stock > 0) && product.rating >= minRating && product.price <= maxPrice;
    });

    return result.sort((a, b) => {
      if (sort === "newest") return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return b.discount - a.discount;
    });
  }, [catalog, brands, categories, inStock, maxPrice, minRating, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggle = (value: string, values: string[], setter: (values: string[]) => void) =>
    { setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]); setPage(1); };

  const clear = () => { setCategories([]); setBrands([]); setInStock(false); setMinRating(0); setMaxPrice(catalogMaxPrice); setQuery(""); setPage(1); };

  const filters = (
    <aside className="space-y-6 rounded-[28px] border border-stone-200/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#8B4513] dark:text-orange-300"><Filter size={18} /><h2 className="font-semibold">Filters</h2></div>
        {activeCount > 0 && <button onClick={clear} className="text-xs font-semibold text-[#8B4513] hover:underline">Clear all</button>}
      </div>
      {[
        { title: "Category", options: categoryOptions, values: categories, setter: setCategories },
        { title: "Brand", options: brandOptions, values: brands, setter: setBrands },
      ].map((section) => (
        <fieldset key={section.title}>
          <legend className="mb-3 text-sm font-semibold text-stone-900 dark:text-white">{section.title}</legend>
          <div className="space-y-2">
            {section.options.map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-3 text-sm text-stone-600 dark:text-stone-300">
                <input type="checkbox" checked={section.values.includes(item)} onChange={() => toggle(item, section.values, section.setter)} className="h-4 w-4 accent-[#8B4513]" />
                {item}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="flex cursor-pointer items-center gap-3 text-sm text-stone-600 dark:text-stone-300">
        <input type="checkbox" checked={inStock} onChange={(event) => { setInStock(event.target.checked); setPage(1); }} className="h-4 w-4 accent-[#8B4513]" />
        In stock only
      </label>
      <fieldset><legend className="mb-3 text-sm font-semibold">Minimum rating</legend><div className="flex flex-wrap gap-2">{[0, 4, 4.5].map((rating) => <button key={rating} type="button" onClick={() => { setMinRating(rating); setPage(1); }} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${minRating === rating ? "border-[#8B4513] bg-[#fff8f1] text-[#8B4513]" : "border-stone-200"}`}>{rating === 0 ? "Any" : <><Star size={13} fill="currentColor" /> {rating}+</>}</button>)}</div></fieldset>
      <label className="block text-sm font-semibold">Price up to ${maxPrice}<input type="range" min="0" max={catalogMaxPrice || 1} value={Math.min(maxPrice, catalogMaxPrice)} onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }} className="mt-3 w-full accent-[#8B4513]" /></label>
    </aside>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-[24px] border border-stone-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input aria-label="Search products" placeholder="Search products, brands and categories" className="pl-11" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          {suggestions.length > 0 && <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-950">{suggestions.map((product) => <button type="button" key={product.id} onClick={() => { setQuery(product.title); setPage(1); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-white/5"><span><strong>{product.title}</strong><span className="ml-2 text-xs text-stone-500">{product.brand}</span></span><span className="text-xs font-semibold">${product.price}</span></button>)}</div>}
        </label>
        <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold lg:hidden">
          <SlidersHorizontal size={17} /> Filters {activeCount ? `(${activeCount})` : ""}
        </button>
        <select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="h-11 rounded-full border border-stone-200 bg-white px-4 text-sm dark:border-white/10 dark:bg-slate-950">
          <option value="featured">Featured</option><option value="newest">Newest</option><option value="rating">Top rated</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
        </select>
      </div>

      {showFilters && <div className="lg:hidden">{filters}</div>}
      {activeCount > 0 && <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Active</span>{categories.map((value) => <Chip key={value} label={value} onRemove={() => toggle(value, categories, setCategories)} />)}{brands.map((value) => <Chip key={value} label={value} onRemove={() => toggle(value, brands, setBrands)} />)}{inStock && <Chip label="In stock" onRemove={() => setInStock(false)} />}{minRating > 0 && <Chip label={`${minRating}+ stars`} onRemove={() => setMinRating(0)} />}{maxPrice < catalogMaxPrice && <Chip label={`Under $${maxPrice}`} onRemove={() => setMaxPrice(catalogMaxPrice)} />}</div>}
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden lg:block">{filters}</div>
        <section aria-live="polite" className="space-y-5">
          <p className="text-sm text-stone-600 dark:text-stone-300">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</p>
          {filteredProducts.length ? <><ProductsPageGridQuickView products={visibleProducts} />{totalPages > 1 && <nav aria-label="Product pagination" className="flex items-center justify-center gap-2 pt-4"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="rounded-full border border-stone-200 p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={18} /></button><span className="px-3 text-sm">Page {currentPage} of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="rounded-full border border-stone-200 p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight size={18} /></button></nav>}</> : (
            <div className="rounded-[28px] border border-dashed border-stone-300 bg-white p-12 text-center dark:border-white/20 dark:bg-slate-900">
              <p className="text-lg font-semibold">No products match your filters</p>
              <button onClick={clear} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#8B4513]"><X size={16} /> Reset search</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) { return <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-full bg-[#fff1df] px-3 py-1.5 text-xs font-semibold text-[#8B4513]">{label}<X size={13} /></button>; }
