import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { ComparisonTable } from "@/components/ui/comparison-table";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { Toaster } from "react-hot-toast";
import "../globals.css";

import { LocaleProvider } from "@/components/locale/locale-context";
import { DEFAULT_LOCALE, languageTag, parseLocaleFromPathSegment } from "@/lib/locale";

// Avoid next/font/google network dependency in environments without external access.
const geistSans = { variable: "--font-geist-sans" } as const;
const geistMono = { variable: "--font-geist-mono" } as const;


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
  const locale = parseLocaleFromPathSegment((await params).locale) ?? DEFAULT_LOCALE;
  const lang = languageTag(locale);



  return (
    <html lang={lang} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)]`}>
        <Providers>
          <LocaleProvider>
            <div className="flex min-h-screen flex-col">
              <ReadingProgress />
              <Navbar />
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
            <ScrollToTop />
            <ComparisonTable />
            <Toaster position="top-right" />
            <PerformanceMonitor />
          </LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}

