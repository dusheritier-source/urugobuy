"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Bell, Heart, Menu, Search, ShoppingBag, User, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/components/locale/locale-context";

const toLocaleHref = (locale: string, path: string) => `/${locale}${path}` as Route;



const navTranslations: Record<string, Record<string, string>> = {
  en: {
    home: "Home",
    products: "Products",
    categories: "Categories",
    deals: "Deals",
    about: "About",
    contact: "Contact",
  },
  fr: {
    home: "Accueil",
    products: "Produits",
    categories: "Catégories",
    deals: "Offres",
    about: "À propos",
    contact: "Contact",
  },
};


function useLocalizedLinks() {
  const { locale } = useLocale();
  const { language } = useLocale();

  const t = navTranslations[language] ?? navTranslations.en;

  const prefix = `/${locale}`;
  const localized = (path: string) => `${prefix}${path}` as Route;

  const links: Array<{ href: Route; label: string }> = [
    { href: localized("/"), label: t.home },
    { href: localized("/products"), label: t.products },
    { href: localized("/categories"), label: t.categories },
    { href: localized("/deals"), label: t.deals },
    { href: localized("/about"), label: t.about },
    { href: localized("/contact"), label: t.contact },
  ];

  return links;
}



const PROMO_DISMISSED_KEY = "urugo:pairsPromoDismissed:v1";

export function Navbar() {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();
  const { locale } = useLocale();
  const links = useLocalizedLinks();

  const [isHydrated, setIsHydrated] = useState(false);

  const [isPromoDismissed, setIsPromoDismissed] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);


  useEffect(() => {
    setIsHydrated(true);
    try {
      const raw = localStorage.getItem(PROMO_DISMISSED_KEY);
      setIsPromoDismissed(raw === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setIsPromoDismissed(true);
    try {
      localStorage.setItem(PROMO_DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    let lastY = window.scrollY;
    const threshold = 8;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (Math.abs(delta) < threshold) return;

      // scroll down => hide, scroll up => show
      if (delta > 0 && y > 80) setIsNavHidden(true);
      if (delta < 0) setIsNavHidden(false);

      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  const showPromo = isHydrated && pathname === "/" && !user && !isPromoDismissed;

  return (
    <>
      {showPromo && (
        <div className="sticky top-0 z-[51] border-b border-stone-200/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
              Register or Sign in to have a better experience —{" "}
<Link
                href={toLocaleHref(locale, "/register")}
                className="font-semibold text-[#8B4513] hover:underline"
              >
                Register
              </Link>{" "}
              or{" "}
<Link
                href={toLocaleHref(locale, "/login")}
                className="font-semibold text-[#8B4513] hover:underline"
              >
                Sign in
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={() => {
                setIsPromoDismissed(true);
                try {
                  localStorage.setItem(PROMO_DISMISSED_KEY, "1");
                } catch {
                  // ignore
                }
              }}
              className="rounded-full border border-stone-200 p-1.5 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513] dark:border-white/10 dark:text-stone-300 dark:hover:border-[#8B4513] dark:hover:text-[#8B4513]"
              aria-label="Dismiss promotion"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}


      <div
        ref={(el) => {
          // spacer div for promo + navbar height to avoid layout jump
          if (!el) return;
          el.style.setProperty("height", "0px");
        }}
      />

      <header
        className={cn(
          "fixed left-0 right-0 z-50 border-b border-stone-200/70 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70",
          "transform-gpu transition-transform duration-200 ease-out",
          "will-change-transform",
          isNavHidden ? "-translate-y-[140%]" : "translate-y-0"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8",
            isNavHidden && "translate-y-[-140%]"
          )}
        >


<Link href={links[0].href} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8B4513] text-lg font-semibold text-white">
              U
            </div>
            <div>
              <p className="text-lg font-semibold text-stone-900">Urugo Buy</p>
              <p className="text-xs uppercase tracking-[0.32em] text-[#FF8C00]">Premium Market</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {links.map((link) => (
              <Link
                key={link.href}
href={link.href}
                className={cn(
                  "text-sm font-medium text-stone-600 transition hover:text-[#8B4513] dark:text-stone-300 dark:hover:text-[#8B4513]",
                  pathname === link.href && "text-[#8B4513]",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/products" aria-label="Search products" className="rounded-full border border-stone-200 p-2.5 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513] dark:border-white/10 dark:text-stone-300 dark:hover:border-[#8B4513] dark:hover:text-[#8B4513]">
              <Search size={18} />
            </Link>
            <Link href={{ pathname: "/profile/wishlist" }} aria-label="Wishlist" className="rounded-full border border-stone-200 p-2.5 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513] dark:border-white/10 dark:text-stone-300 dark:hover:border-[#8B4513] dark:hover:text-[#8B4513]">
              <Heart size={18} />
            </Link>
            <button className="rounded-full border border-stone-200 p-2.5 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513] dark:border-white/10 dark:text-stone-300 dark:hover:border-[#8B4513] dark:hover:text-[#8B4513]">
              <Bell size={18} />
            </button>
            <Link href="/cart" className="rounded-full border border-stone-200 p-2.5 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513] dark:border-white/10 dark:text-stone-300 dark:hover:border-[#8B4513] dark:hover:text-[#8B4513]">
              <ShoppingBag size={18} />
            </Link>

            <ThemeToggle />

            {user ? (
              <>
                <Link href="/profile" className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513] dark:border-white/10 dark:text-stone-300 dark:hover:border-[#8B4513] dark:hover:text-[#8B4513]">
                  <User size={18} />
                  <span>{user.displayName || "Profile"}</span>
                </Link>
                <button
                  onClick={() => signOutUser()}
                  className="rounded-full border border-stone-200 p-2.5 text-stone-600 transition hover:border-red-500 hover:text-red-500 dark:border-white/10 dark:text-stone-300 dark:hover:border-red-500 dark:hover:text-red-500"
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>

              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-[#8B4513] px-5 py-2 text-sm font-semibold text-[#8B4513] transition hover:bg-[#8B4513] hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-[#8B4513] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          <button onClick={() => setIsMobileOpen(!isMobileOpen)} aria-expanded={isMobileOpen} aria-controls="mobile-navigation" aria-label="Toggle navigation" className="rounded-full border border-stone-200 p-2.5 text-stone-600 lg:hidden dark:border-white/10 dark:text-stone-300">
            {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

        </div>
        {isMobileOpen && (
          <nav id="mobile-navigation" className="border-t border-stone-200 bg-white px-4 py-4 dark:border-white/10 dark:bg-slate-950 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-1">
              {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)} className="rounded-xl px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-[#fff8f1] dark:text-stone-200">{link.label}</Link>)}
              <div className="mt-2 flex gap-2 border-t border-stone-200 pt-4 dark:border-white/10">
                <Link href="/cart" onClick={() => setIsMobileOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#8B4513] px-4 py-3 text-sm font-semibold text-white"><ShoppingBag size={17} /> Cart</Link>
                <Link href={user ? "/profile" : "/login"} onClick={() => setIsMobileOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#8B4513] px-4 py-3 text-sm font-semibold text-[#8B4513]"><User size={17} /> {user ? "Account" : "Sign in"}</Link>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

