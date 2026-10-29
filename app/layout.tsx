import type { Metadata } from "next";
import { ShoppingAssistant } from "@/components/assistant/shopping-assistant";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { ComparisonTable } from "@/components/ui/comparison-table";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { PrivacyAnalytics } from "@/components/analytics/privacy-analytics";
import { StructuredData } from "@/components/ui/seo/structured-data";
import { BottomNavigation } from "@/components/mobile/bottom-navigation";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://urugobuy.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Urugo Buy | Premium shopping in Rwanda",
  description: "A premium e-commerce experience for modern shoppers in Rwanda.",
  keywords: "e-commerce, Rwanda, shopping, premium, online store",
  authors: [{ name: "Urugo Buy" }],
  openGraph: {
    title: "Urugo Buy | Premium shopping in Rwanda",
    description: "A premium e-commerce experience for modern shoppers in Rwanda.",
    type: "website",
    locale: "en_RW",
    siteName: "Urugo Buy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Urugo Buy | Premium shopping in Rwanda",
    description: "A premium e-commerce experience for modern shoppers in Rwanda.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen overflow-x-hidden bg-[var(--background)] font-sans text-[var(--foreground)]">
        <a href="#main-content" className="sr-only z-[200] rounded bg-white p-3 text-[#8B4513] focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Skip to main content</a>
        <Providers>
          <div className="flex min-h-screen flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <ReadingProgress />
            <Navbar />
            <div id="main-content" className="flex-1" tabIndex={-1}>{children}</div>
            <Footer />
          </div>
          <ShoppingAssistant />
          <BottomNavigation />
          <ScrollToTop />
          <ComparisonTable />
          <Toaster position="top-right" />
          <PerformanceMonitor />
          <PrivacyAnalytics />
          <StructuredData type="organization" data={{}} />
          <StructuredData type="website" data={{}} />
        </Providers>
      </body>
    </html>
  );
}
