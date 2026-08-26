"use client";

import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { ProductsPageGridQuickView } from "./product-grid-quickview";
import { readCatalog } from "@/lib/catalog-storage";
import { searchProducts } from "@/lib/search";
import { useUIStore } from "@/store/ui-store";

type SortKey = "featured" | "newest" | "rating" | "price-asc" | "price-desc";

export function ProductsSearchResults({ allProducts, initialCategory = "", initialQuery = "" }: { allProducts: Product[]; initialCategory?: string; initialQuery?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const addRecentSearch = useUIStore((state) => state.addRecentSearch);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
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
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!searchFormRef.current?.contains(event.target as Node)) setSuggestionsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  const categoryOptions = useMemo(() => [...new Set(catalog.map((p) => p.category))].sort(), [catalog]);
  const brandOptions = useMemo(() => [...new Set(catalog.map((p) => p.brand))].sort(), [catalog]);
  const catalogMaxPrice = useMemo(() => Math.ceil(Math.max(...catalog.map((p) => p.price), 0)), [catalog]);
  const activeCount = categories.length + brands.length + Number(inStock) + Number(minRating > 0) + Number(maxPrice < catalogMaxPrice);
  const rankedMatches = useMemo(
    () => query.trim() ? searchProducts(catalog, query, { limit: catalog.length }) : [],
    [catalog, query],
  );
  const relevance = useMemo(() => new Map(rankedMatches.map((result, index) => [result.product.id, index])), [rankedMatches]);
  const suggestions = useMemo(() => query.trim().length < 2 ? [] : rankedMatches.slice(0, 6).map((result) => result.product), [query, rankedMatches]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim();
    const result = catalog.filter((product) => {
      const matchesQuery = !normalized || relevance.has(product.id);
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
      if (normalized) return (relevance.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (relevance.get(b.id) ?? Number.MAX_SAFE_INTEGER);
      return b.discount - a.discount;
    });
  }, [catalog, brands, categories, inStock, maxPrice, minRating, query, relevance, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggle = (value: string, values: string[], setter: (values: string[]) => void) =>
    { setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]); setPage(1); };

  const clear = () => { setCategories([]); setBrands([]); setInStock(false); setMinRating(0); setMaxPrice(catalogMaxPrice); setQuery(""); setPage(1); };

  const commitSearch = (value = query) => {
    const trimmed = value.trim();
    setQuery(trimmed);
    setPage(1);
    if (trimmed) addRecentSearch(trimmed);
    setSuggestionsOpen(false);
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    if (categories.length === 1) params.set("category", categories[0]);
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ""}` as Route, { scroll: false });
  };

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
        <form ref={searchFormRef} className="relative" role="search" onSubmit={(event) => { event.preventDefault(); commitSearch(); }} onKeyDown={(event) => { if (event.key === "Escape") setSuggestionsOpen(false); }}>
          <label htmlFor="catalog-search" className="sr-only">Search the product catalog</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <Input id="catalog-search" autoComplete="off" aria-autocomplete="list" aria-controls="catalog-suggestions" aria-expanded={suggestionsOpen && suggestions.length > 0} placeholder="Search products, brands, categories, colors…" className="pl-11 pr-24" value={query} onFocus={() => setSuggestionsOpen(true)} onChange={(e) => { setQuery(e.target.value); setSuggestionsOpen(true); setPage(1); }} />
          {query && <button type="button" aria-label="Clear search" onClick={() => commitSearch("")} className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 hover:bg-stone-100"><X size={15} /></button>}
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#8B4513] px-3 py-1.5 text-xs font-semibold text-white">Search</button>
          {suggestionsOpen && suggestions.length > 0 && <div id="catalog-suggestions" role="listbox" className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-stone-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-950"><div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Top matches</div>{suggestions.map((product) => <button role="option" aria-selected="false" type="button" key={product.id} onClick={() => { setSuggestionsOpen(false); addRecentSearch(product.title); router.push(`/products/${product.slug}` as Route); }} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-stone-50 dark:hover:bg-white/5"><span className="min-w-0"><strong className="block truncate">{product.title}</strong><span className="text-xs text-stone-500">{product.brand} · {product.category}</span></span><span className="ml-3 text-xs font-semibold">${product.price.toFixed(2)}</span></button>)}</div>}
        </form>
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
          <p className="text-sm text-stone-600 dark:text-stone-300"><strong className="text-stone-900 dark:text-white">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? "product" : "products"}{query.trim() ? <> for “{query.trim()}”</> : null}</p>
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
