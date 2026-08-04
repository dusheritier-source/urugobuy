"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Specification {
  label: string;
  value: string;
}

interface ProductSpecificationsProps {
  specifications: Specification[];
  className?: string;
}

export function ProductSpecifications({ specifications, className }: ProductSpecificationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleSpecs = isExpanded ? specifications : specifications.slice(0, 4);

  if (specifications.length === 0) return null;

  return (
    <div className={cn("rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm", className)}>
      <h3 className="text-xl font-semibold text-stone-900">Specifications</h3>
      
      <div className="mt-4 space-y-3">
        {visibleSpecs.map((spec, index) => (
          <div
            key={index}
            className="flex items-start justify-between border-b border-stone-100 pb-3 last:border-0"
          >
            <span className="text-sm font-medium text-stone-600">{spec.label}</span>
            <span className="text-sm text-stone-900 text-right max-w-[60%]">{spec.value}</span>
          </div>
        ))}
      </div>

      {specifications.length > 4 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm font-medium text-[#8B4513] transition hover:text-[#6d3410]"
        >
          {isExpanded ? "Show less" : `Show all ${specifications.length} specifications`}
          <ChevronDown
            size={16}
            className={cn("transition-transform", isExpanded && "rotate-180")}
          />
        </button>
      )}
    </div>
  );
}