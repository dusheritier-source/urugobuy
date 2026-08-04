import { cn } from "@/lib/utils";

interface ProductBadgeProps {
  type: "new" | "sale" | "trending" | "bestseller" | "limited";
  className?: string;
}

const badgeStyles = {
  new: "bg-blue-500 text-white",
  sale: "bg-red-500 text-white",
  trending: "bg-purple-500 text-white",
  bestseller: "bg-green-500 text-white",
  limited: "bg-orange-500 text-white",
};

const badgeLabels = {
  new: "New",
  sale: "Sale",
  trending: "Trending",
  bestseller: "Bestseller",
  limited: "Limited",
};

export function ProductBadge({ type, className }: ProductBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        badgeStyles[type],
        className
      )}
    >
      {badgeLabels[type]}
    </span>
  );
}