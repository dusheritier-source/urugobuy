import { ProductRecommendations } from "@/components/recommendations/product-recommendations";
import { publishedProducts } from "@/lib/server/catalog";
import { sellingPrice } from "@/lib/product-pricing";
import { STORE_POLICIES } from "@/lib/store-policies";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { products } from "@/lib/data";
import { findPublishedProduct } from "@/lib/server/catalog";
import { ProductPurchasePanel } from "@/components/products/product-purchase-panel";
import type { Metadata } from "next";
import { CustomerReviews } from "@/components/products/customer-reviews";
import { StructuredData } from "@/components/ui/seo/structured-data";
import type { Locale } from "@/lib/locale";
import { getLanguageFromLocale } from "@/lib/locale";
import { productContent, translate } from "@/lib/translations";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale?: Locale }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const product = await findPublishedProduct(slug);
  if (!product) return {};
  const localizedProduct = productContent(product, locale ? getLanguageFromLocale(locale) : "en");
  return { title: `${localizedProduct.title} | Urugo Buy`, description: localizedProduct.description, openGraph: { images: product.images.slice(0, 1) } };
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; locale?: Locale }> }) {
  const { slug, locale } = await params;
  const product = await findPublishedProduct(slug);

  if (!product) {
    notFound();
  }

  const language = locale ? getLanguageFromLocale(locale) : "en";
  const localizedProduct = productContent(product, language);
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={locale ? `/${locale}/products` : "/products"} className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#8B4513]">
        <ArrowLeft size={16} /> {t("backToProducts")}
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] border border-stone-200/70 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]">
            <Image src={product.images[0]} alt={localizedProduct.title} fill unoptimized className="object-cover" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {product.images.slice(1).map((image) => (
              <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-stone-200/70 bg-white">
                <Image src={image} alt={`${localizedProduct.title} detail`} fill unoptimized className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-[0_25px_90px_-45px_rgba(139,69,19,0.3)]">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-[#fff8f1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[#8B4513]">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={16} fill="currentColor" /> {product.rating}
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-stone-900">{localizedProduct.title}</h1>
          <p className="mt-3 text-sm leading-7 text-stone-600">{localizedProduct.description}</p>
          <div className="mt-6 flex items-end gap-3">
            <p className="text-3xl font-semibold text-stone-900">${sellingPrice(product).toFixed(2)}</p>
            <p className="text-sm text-stone-500 line-through">${product.price.toFixed(2)}</p>
            <span className="rounded-full bg-[#ffe6c9] px-3 py-1 text-sm font-semibold text-[#8B4513]">-{product.discount}%</span>
          </div>
          <div className="mt-6 space-y-3 text-sm text-stone-700">
            <p><span className="font-semibold">{t("brand")}:</span> {product.brand}</p>
            <p><span className="font-semibold">{t("colors")}:</span> {product.colors.join(", ")}</p>
            <p><span className="font-semibold">{t("sizes")}:</span> {product.sizes.join(", ")}</p>
            <p><span className="font-semibold">{t("stock")}:</span> {product.stock} {t("itemsAvailable")}</p>
          </div>
          <ProductPurchasePanel product={localizedProduct} />
          <div className="mt-8 rounded-[24px] bg-[#fdf7f1] p-4 text-sm text-stone-600">
            <p className="font-semibold text-stone-900">{t("specifications")}</p>
            <ul className="mt-3 space-y-2">
              <li>• Premium craftsmanship and elegant finishing.</li>
              <li>• Built for comfort, durability, and everyday use.</li>
              <li>• {STORE_POLICIES.warranty.text}</li>
            </ul>
          </div>
        </div>
      </div>
      <ProductRecommendations key={product.id} productId={product.id} products={await publishedProducts()} currency={process.env.PAYMENT_CURRENCY || "USD"} />
      <CustomerReviews productId={product.id} fallbackRating={product.rating} />
      <StructuredData type="product" data={{ name: localizedProduct.title, description: localizedProduct.description, image: product.images[0], price: product.price * (1 - product.discount / 100), currency: "USD", availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", brand: product.brand, sku: product.id }} />
      <StructuredData type="breadcrumb" data={[{ name: t("products"), url: locale ? `/${locale}/products` : "/products" }, { name: localizedProduct.title, url: locale ? `/${locale}/products/${product.slug}` : `/products/${product.slug}` }]} />
    </main>
  );
}
