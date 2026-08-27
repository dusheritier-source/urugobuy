import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#66320f] via-[#8a491e] to-[#bd640b] px-5 py-8 text-white shadow-[0_20px_55px_-28px_rgba(113,55,15,0.7)] sm:rounded-[36px] sm:bg-gradient-to-br sm:from-[#8B4513] sm:via-[#9a5a26] sm:to-[#ff8c00] sm:px-6 sm:py-12 sm:shadow-2xl md:px-10 lg:px-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_35%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur sm:text-sm">
            <Sparkles size={16} />
            Rwanda’s premium shopping experience
          </div>
          <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl">
            Discover the finest essentials from Rwanda and beyond.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-6 text-white/80 sm:text-lg">
            Urugo Buy brings together the best in fashion, technology, home, and beauty with a curated, premium feel.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button asChild className="min-h-11 bg-white text-[#8B4513] hover:bg-[#f5f5f5]"><Link href="/products">Shop Now</Link></Button>
            <Link href="/products" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:px-4">
              Browse products <ArrowRight size={16} />
            </Link>
          </div>
          <form action="/products" method="get" role="search" className="mt-7 flex gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur sm:mt-8 sm:gap-3 sm:rounded-[24px] sm:p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <label htmlFor="hero-search" className="sr-only">Search products</label>
              <Input id="hero-search" name="q" type="search" placeholder="What are you looking for?" className="h-12 pl-11 pr-3 text-stone-700" />
            </div>
            <Button type="submit" aria-label="Search products" className="h-12 w-12 shrink-0 bg-[#e97700] px-0 hover:bg-[#cf6900] sm:w-auto sm:bg-[#FF8C00] sm:px-4 sm:hover:bg-[#e67e00]"><Search size={19} /><span className="hidden sm:ml-2 sm:inline">Search products</span></Button>
          </form>
        </div>
        <div className="rounded-[24px] border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur sm:rounded-[32px] sm:p-4">
          <div className="rounded-[24px] bg-white p-4 text-stone-800">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#8B4513]">Today’s spotlight</p>
            <h2 className="mt-3 text-2xl font-semibold">Limited-time luxury bundles</h2>
            <p className="mt-2 text-sm text-stone-600">Enjoy up to 30% off handcrafted favorites and premium tech upgrades.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Free shipping", value: "Above $120" },
                { label: "Secure checkout", value: "Protected" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-[#fff8f1] p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8B4513]">{item.label}</p>
                  <p className="mt-1 font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
