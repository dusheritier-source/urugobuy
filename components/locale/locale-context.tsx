"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/locale";
import { DEFAULT_LOCALE, getLanguageFromLocale, getRegionFromLocale, stripLocalePrefix } from "@/lib/locale";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";

type LocaleContextValue = {
  locale: Locale;
  language: ReturnType<typeof getLanguageFromLocale>;
  region: ReturnType<typeof getRegionFromLocale>;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem("urugo:locale");
    if (stored) return stored as Locale;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (!pathname) return;

    const { locale: urlLocale } = stripLocalePrefix(pathname);
    const segs = pathname.split("/").filter(Boolean);
    const first = segs[0];

    // If the URL already contains a supported locale, trust it.
    if (first && first.includes("_")) {
      setLocaleState(urlLocale);
      try {
        localStorage.setItem("urugo:locale", urlLocale);
      } catch {
        // ignore
      }
      return;
    }

    // Otherwise, fallback to stored preference.
    const initial = getInitialLocale();
    setLocaleState(initial);
    try {
      localStorage.setItem("urugo:locale", initial);
    } catch {
      // ignore
    }
  }, [pathname]);


  const language = useMemo(() => getLanguageFromLocale(locale), [locale]);
  const region = useMemo(() => getRegionFromLocale(locale), [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("urugo:locale", next);
    } catch {
      // ignore
    }

    if (!pathname) return;
    const { rest } = stripLocalePrefix(pathname);
    router.push(`/${next}${rest}` as Route);
  };

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      language,
      region,
      setLocale,
    }),
    [locale, language, region],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

