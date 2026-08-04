"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { products } from "@/lib/data";
import { getSearchSuggestions } from "@/lib/search";

interface SearchBarProps {
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ className, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // Suggestions are derived from the current query.
  const trimmedQuery = query.trim();
  const derivedSuggestions = trimmedQuery.length === 0 ? [] : getSearchSuggestions(products, trimmedQuery, 5);



  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { recentSearches, addRecentSearch } = useUIStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);







  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      onSearch?.(searchQuery.trim());
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const trendingSearches = ["Smart Speaker", "Leather Bag", "Ceramic Lamp", "Skin Serum"];

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products..."
            className="w-full rounded-full border border-stone-200 bg-white py-3 pl-12 pr-12 text-sm outline-none transition focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition hover:bg-stone-100"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {isOpen && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-xl">
          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length === 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-stone-900 mb-2">Recent Searches</h4>
              <div className="space-y-1">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-3 w-full rounded-lg p-2 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  >
                    <Clock size={16} className="text-stone-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {query.length === 0 && (
            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-2">Trending</h4>
              <div className="space-y-1">
                {trendingSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-3 w-full rounded-lg p-2 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  >
                    <TrendingUp size={16} className="text-[#FF8C00]" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {query.length > 0 && derivedSuggestions.length > 0 && (

            <div>
              <h4 className="text-sm font-semibold text-stone-900 mb-2">Suggestions</h4>
              <div className="space-y-1">
                {derivedSuggestions.map((suggestion, index) => (

                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion.title)}
                    className="flex items-center gap-3 w-full rounded-lg p-2 text-left text-sm text-stone-700 transition hover:bg-stone-50"
                  >
                    <Search size={16} className="text-stone-400" />
                    {suggestion.title}

                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {query.length > 0 && derivedSuggestions.length === 0 && (
            <div className="py-4 text-center">
No results found for {query}





            </div>
          )}
        </div>
      )}
    </div>
  );
}