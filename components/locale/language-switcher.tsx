"use client";

import { LANGUAGES, LANGUAGE_NAMES, type Locale } from "@/lib/locale";
import { useLocale } from "@/components/locale/locale-context";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, region, setLocale, t } = useLocale();
  return <label className={className}>
    <span className="sr-only">{t("language")}</span>
    <select
      aria-label={t("language")}
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      className="h-10 max-w-36 rounded-full border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 outline-none focus:border-[#8B4513] dark:border-white/15 dark:bg-slate-900 dark:text-stone-200"
    >
      {LANGUAGES.map((language) => {
        const value = `${language}_${region}` as Locale;
        return <option key={language} value={value}>{LANGUAGE_NAMES[language]}</option>;
      })}
    </select>
  </label>;
}
