"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { products, categories, featuredBrands } from "@/lib/data";

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

interface FilterState {
  priceRange: [number, number];
  categories: string[];
  brands: string[];
  rating: number;
  inStock: boolean;
  onSale: boolean;
}

export function ProductFilters({ onFilterChange, className }: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 500],
    categories: [],
    brands: [],
    rating: 0,
    inStock: false,
    onSale: false,
  });

  const maxPrice = Math.max(...products.map((p) => p.price));

  const handlePriceChange = (index: number, value: number) => {
    const newRange: [number, number] = [...filters.priceRange] as [number, number];
    newRange[index] = value;
    const updated = { ...filters, priceRange: newRange };
    setFilters(updated);
    onFilterChange(updated);
  };

  const toggleCategory = (category: string) => {
    const updated = {
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    };
    setFilters(updated);
    onFilterChange(updated);
  };

  const toggleBrand = (brand: string) => {
    const updated = {
      ...filters,
      brands: filters.brands.includes(brand)
        ? filters.brands.filter((b) => b !== brand)
        : [...filters.brands, brand],
    };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      priceRange: [0, maxPrice],
      categories: [],
      brands: [],
      rating: 0,
      inStock: false,
      onSale: false,
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeFiltersCount =
    filters.categories.length +
    filters.brands.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#8B4513] hover:text-[#8B4513]"
      >
        <SlidersHorizontal size={18} />
        Filters
        {activeFiltersCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8B4513] text-xs text-white">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Filters</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-stone-600 transition hover:bg-stone-100"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {/* Price Range */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-3">Price Range</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) => handlePriceChange(0, Number(e.target.value))}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#8B4513]"
                    placeholder="Min"
                  />
                  <span className="text-stone-400">-</span>
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm outline-none focus:border-[#8B4513]"
                    placeholder="Max"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-3">Categories</h4>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                      className="rounded border-stone-300 text-[#8B4513] focus:ring-[#8B4513]"
                    />
                    <span className="text-sm text-stone-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-3">Brands</h4>
              <div className="space-y-2">
                {featuredBrands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="rounded border-stone-300 text-[#8B4513] focus:ring-[#8B4513]"
                    />
                    <span className="text-sm text-stone-700">{brand}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-3">Minimum Rating</h4>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      const updated = { ...filters, rating: filters.rating === star ? 0 : star };
                      setFilters(updated);
                      onFilterChange(updated);
                    }}
                    className="transition"
                  >
                    <svg
                      className={cn(
                        "h-6 w-6",
                        star <= filters.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-stone-300 text-stone-300"
                      )}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-3">Quick Filters</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={() => {
                      const updated = { ...filters, inStock: !filters.inStock };
                      setFilters(updated);
                      onFilterChange(updated);
                    }}
                    className="rounded border-stone-300 text-[#8B4513] focus:ring-[#8B4513]"
                  />
                  <span className="text-sm text-stone-700">In Stock Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onSale}
                    onChange={() => {
                      const updated = { ...filters, onSale: !filters.onSale };
                      setFilters(updated);
                      onFilterChange(updated);
                    }}
                    className="rounded border-stone-300 text-[#8B4513] focus:ring-[#8B4513]"
                  />
                  <span className="text-sm text-stone-700">On Sale</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={clearFilters}
              className="flex-1 rounded-full border border-stone-200 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-full bg-[#8B4513] py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}