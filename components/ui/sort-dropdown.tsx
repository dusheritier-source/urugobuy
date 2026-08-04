"use client";

import { useState } from "react";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

interface SortDropdownProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
  className?: string;
}

const sortOptions: SortOption[] = [
  { value: "featured", label: "Featured", icon: <ArrowUpDown size={16} /> },
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export function SortDropdown({ currentSort, onSortChange, className }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = sortOptions.find((opt) => opt.value === currentSort) || sortOptions[0];

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#8B4513] hover:text-[#8B4513]"
      >
        <ArrowUpDown size={16} />
        Sort by: {currentOption.label}
        <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-[20px] border border-stone-200/70 bg-white p-2 shadow-xl">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-left text-sm transition",
                currentSort === option.value
                  ? "bg-[#8B4513] text-white"
                  : "text-stone-700 hover:bg-stone-50"
              )}
            >
              {option.icon}
              {option.label}
              {currentSort === option.value && (
                <svg className="ml-auto h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}