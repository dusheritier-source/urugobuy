import { SmartRecommendations } from "@/components/recommendations/smart-recommendations";
import { publishedProducts } from "@/lib/server/catalog";
import { HeroSection } from "@/components/home/hero";
import { Categories } from "@/components/home/categories";
import { ProductGrid } from "@/components/home/product-grid";
import { categories, reviews } from "@/lib/data";
import { ArrowRight, BadgeCheck, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

export const revalidate = 60;

export default async function Home() {
  const products = await publishedProducts();
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-7 px-3 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <HeroSection />
      <section className="grid grid-cols-3 gap-2 rounded-[24px] border border-[#eadfd4] bg-[var(--mobile-surface)] p-3 shadow-sm sm:gap-4 sm:rounded-[32px] sm:border-stone-200/70 sm:bg-white sm:p-6">
        {[
          { title: "Fast delivery", description: "Ships within 24 hours across Rwanda.", icon: Truck },
          { title: "Secure checkout", description: "Protected payments and trusted support.", icon: ShieldCheck },
          { title: "Premium quality", description: "Carefully selected products for daily luxury.", icon: BadgeCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl bg-[var(--mobile-surface-muted)] p-2.5 text-center sm:rounded-[24px] sm:bg-[#fff8f1] sm:p-4 sm:text-left">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#8B4513] shadow-sm sm:mx-0 sm:h-11 sm:w-11">
                <Icon size={18} />
              </div>
              <h3 className="mt-2 text-xs font-semibold leading-tight text-stone-900 sm:mt-4 sm:text-lg">{item.title}</h3>
              <p className="mt-2 hidden text-sm text-stone-600 sm:block">{item.description}</p>
            </div>
          );
        })}
      </section>
      <Categories categories={categories} />
      <SmartRecommendations products={products} currency={process.env.PAYMENT_CURRENCY || "USD"} />
      <ProductGrid products={products.slice(0, 3)} title="Flash sale" />
      <ProductGrid products={products.slice(3)} title="Trending" />
      <section className="grid gap-6 rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-sm lg:grid-cols-[1fr_0.85fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Customer reviews</p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">Why shoppers love Urugo Buy</h2>
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-[24px] border border-stone-200/70 bg-[#fffaf4] p-4">
                <p className="text-sm font-semibold text-stone-900">{review.author}</p>
                <p className="mt-2 text-sm text-stone-600">“{review.comment}”</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] bg-gradient-to-br from-[#8B4513] to-[#FF8C00] p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Newsletter</p>
          <h3 className="mt-3 text-2xl font-semibold">Get first access to launch offers</h3>
          <p className="mt-3 text-sm text-white/80">Subscribe to receive curated drops, exclusive deals, and product updates.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <input className="flex-1 rounded-full border border-white/20 bg-white/20 px-4 py-3 text-sm text-white placeholder:text-white/60 outline-none" placeholder="Email address" />
            <button className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#8B4513]">Join</button>
          </div>
          <Link href="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
            Explore collection <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
