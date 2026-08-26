import type { Metadata } from "next";
import { DEFAULT_LOCALE, languageTag, parseLocaleFromPathSegment } from "@/lib/locale";


type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};



export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = parseLocaleFromPathSegment((await params).locale) ?? DEFAULT_LOCALE;
  const tag = languageTag(locale);


  return {
    title: "Urugo Buy | Premium shopping in Rwanda",
    description: "A premium e-commerce experience for modern shoppers in Rwanda.",
    keywords: "e-commerce, Rwanda, shopping, premium, online store",
    authors: [{ name: "Urugo Buy" }],
    openGraph: {
      title: "Urugo Buy | Premium shopping in Rwanda",
      description: "A premium e-commerce experience for modern shoppers in Rwanda.",
      type: "website",
locale: locale,

      siteName: "Urugo Buy",
    },
    twitter: {
      card: "summary_large_image",
      title: "Urugo Buy | Premium shopping in Rwanda",
      description: "A premium e-commerce experience for modern shoppers in Rwanda.",
    },
    metadataBase: undefined,
    // Next doesn't use html lang from Metadata; we set it in the layout.
    // Keep this for future enhancements.
    other: {
      "content-language": tag,
    },
  } as Metadata;
}

export default async function LocaleRootLayout({ children, params }: Props) {
  await params;
  return children;
}

