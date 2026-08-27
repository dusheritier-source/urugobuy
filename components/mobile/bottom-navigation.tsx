"use client";

import { Home, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { useLocale } from "@/components/locale/locale-context";

const navItems: Array<{ href: string; icon: React.ComponentType<{ size?: number }>; label: string }> = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/products", icon: Search, label: "Search" },
  { href: "/cart", icon: ShoppingCart, label: "Cart" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const { locale } = useLocale();

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#eadfd4] bg-[var(--mobile-surface)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_35px_-18px_rgba(113,55,15,0.24)] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 pt-1.5">
        {navItems.map((item) => {
          const href = `/${locale}${item.href}` as Route;
          const isActive = pathname === href || (item.href !== "/" && pathname.startsWith(href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition active:scale-95",
                isActive ? "text-[var(--mobile-brand)]" : "text-stone-500"
              )}
            >
              {isActive && <span className="absolute top-0 h-1 w-6 rounded-full bg-[var(--mobile-accent)]" />}
              <div className="relative">
                <Icon size={24} />
                {item.href === "/cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
