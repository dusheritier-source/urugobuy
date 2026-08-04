import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-[#8B4513] via-[#9a5a26] to-[#ff8c00] px-6 py-12 text-white shadow-2xl md:px-10 lg:px-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_35%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm backdrop-blur">
            <Sparkles size={16} />
            Rwanda’s premium shopping experience
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Discover the finest essentials from Rwanda and beyond.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/80">
            Urugo Buy brings together the best in fashion, technology, home, and beauty with a curated, premium feel.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button className="bg-white text-[#8B4513] hover:bg-[#f5f5f5]">
              Shop Now
            </Button>
            <Link href="/products" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Browse products <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-8 flex flex-col gap-3 rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input placeholder="Search for products" className="pl-11 text-stone-700" />
            </div>
            <Button className="bg-[#FF8C00] hover:bg-[#e67e00]">Find deals</Button>
          </div>
        </div>
        <div className="rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur">
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
