"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/locale";
import { DEFAULT_LOCALE, getLanguageFromLocale, getRegionFromLocale, isSupportedLocale, languageTag, parseLocaleFromPathSegment, stripLocalePrefix } from "@/lib/locale";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { translate, type TranslationKey } from "@/lib/translations";

type LocaleContextValue = {
  locale: Locale;
  language: ReturnType<typeof getLanguageFromLocale>;
  region: ReturnType<typeof getRegionFromLocale>;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem("urugo:locale");
    if (stored && isSupportedLocale(stored)) return stored;
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

    const segs = pathname.split("/").filter(Boolean);
    const first = segs[0];

    // If the URL already contains a supported locale, trust it.
    const urlLocale = parseLocaleFromPathSegment(first);
    if (urlLocale) {
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
  const t = useMemo(() => (key: TranslationKey) => translate(language, key), [language]);

  useEffect(() => {
    document.documentElement.lang = languageTag(locale);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language, locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("urugo:locale", next);
    } catch {
      // ignore
    }

    if (!pathname) return;
    const { rest } = stripLocalePrefix(pathname);
    router.push(`/${next}${rest}${window.location.search}` as Route);
  }, [pathname, router]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      language,
      region,
      setLocale,
      t,
    }),
    [locale, language, region, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
