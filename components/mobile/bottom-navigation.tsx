"use client";

import { useState } from "react";
import { Home, Search, ShoppingCart, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const navItems: Array<{ href: string; icon: React.ComponentType<{ size?: number }>; label: string }> = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/products", icon: Search, label: "Search" },
  { href: "/cart", icon: ShoppingCart, label: "Cart" },
  { href: "/wishlist", icon: Heart, label: "Wishlist" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [cartCount] = useState(3); // In real app, get from cart store

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white pb-safe dark:border-white/10 dark:bg-slate-950/70">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 transition",
                isActive ? "text-[#8B4513]" : "text-stone-400"
              )}
            >
              <div className="relative">
                <Icon size={24} />
                {item.href === "/cart" && cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
