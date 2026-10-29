export const LANGUAGES = ["en", "rw", "fr", "zh", "sw", "ar", "es", "pt", "hi", "de"] as const;

export type SupportedLanguage = (typeof LANGUAGES)[number];

export type SupportedRegion = "RW" | "KE" | "UG";

export type Locale = `${SupportedLanguage}_${SupportedRegion}`;

export const DEFAULT_LOCALE: Locale = "en_RW";

export const LOCALES: Locale[] = LANGUAGES.map((language) => `${language}_RW` as Locale);
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  rw: "Kinyarwanda",
  fr: "Français",
  zh: "中文（简体）",
  sw: "Kiswahili",
  ar: "العربية",
  es: "Español",
  pt: "Português",
  hi: "हिन्दी",
  de: "Deutsch",
};

export const REGION_BY_LOCALE: Partial<Record<Locale, SupportedRegion>> = {
  "en_RW": "RW",
  "fr_RW": "RW",
};


export function parseLocaleFromPathSegment(segment: string | undefined): Locale | null {
  if (!segment) return null;
  if (segment.includes("/")) return null;
  const normalized = segment.replace("-", "_");
  if (isSupportedLocale(normalized)) return normalized as Locale;
  return null;
}

export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

export function buildLocalePath(locale: Locale, pathname: string): string {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === DEFAULT_LOCALE) {
    // Still keep prefix so switching feels consistent; can be changed later.
    return `/${locale}${cleanPath}`;
  }
  return `/${locale}${cleanPath}`;
}

export function stripLocalePrefix(pathname: string): { locale: Locale; rest: string } {
  const segs = pathname.split("/").filter(Boolean);
  const maybeLocale = segs[0];
  const locale = parseLocaleFromPathSegment(maybeLocale);
  if (!locale) return { locale: DEFAULT_LOCALE, rest: pathname || "/" };
  const rest = segs.slice(1).join("/");
  return { locale, rest: `/${rest}`.replace(/\/$/, "") || "/" };
}

export function getLanguageFromLocale(locale: Locale): SupportedLanguage {
  return locale.split("_")[0] as SupportedLanguage;
}

export function getRegionFromLocale(locale: Locale): SupportedRegion {
  return locale.split("_")[1] as SupportedRegion;
}

export function languageTag(locale: Locale): string {
  const [lang, region] = locale.split("_");
  return `${lang}${lang === "zh" ? "-Hans" : ""}-${region}`;
}
