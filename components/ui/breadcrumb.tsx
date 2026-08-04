import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex items-center gap-2 text-sm", className)} aria-label="Breadcrumb">
      <Link
        href="/"
        className="flex items-center gap-1 text-stone-600 transition hover:text-[#8B4513]"
      >
        <Home size={16} />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-stone-400" />
          {item.href ? (
              <Link
              	href={item.href as any}
              	className="text-stone-600 transition hover:text-[#8B4513]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-stone-900">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}