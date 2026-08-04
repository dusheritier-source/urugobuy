import { cn } from "@/lib/utils";

interface StockIndicatorProps {
  stock: number;
  className?: string;
}

export function StockIndicator({ stock, className }: StockIndicatorProps) {
  const getStockStatus = () => {
    if (stock === 0) {
      return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-50" };
    } else if (stock <= 5) {
      return { label: `Only ${stock} left`, color: "text-orange-600", bg: "bg-orange-50" };
    } else if (stock <= 20) {
      return { label: `Low Stock (${stock})`, color: "text-yellow-600", bg: "bg-yellow-50" };
    } else {
      return { label: "In Stock", color: "text-green-600", bg: "bg-green-50" };
    }
  };

  const status = getStockStatus();

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", status.bg, status.color)}>
        {stock === 0 && (
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-red-600" />
        )}
        {stock > 0 && stock <= 5 && (
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse" />
        )}
        {stock > 5 && (
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-600" />
        )}
        {status.label}
      </span>
    </div>
  );
}