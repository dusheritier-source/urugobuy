import Link from "next/link";
import { Globe, Mail, Phone, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#fffaf4]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-12">
        <div className="col-span-2 lg:col-span-1">
          <p className="text-lg font-semibold text-stone-900">Urugo Buy</p>
          <p className="mt-3 text-sm text-stone-600">A premium digital marketplace designed for modern shoppers in Rwanda and beyond.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B4513]">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            <li><Link href="/products">Products</Link></li>
            <li><Link href="/categories">Categories</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B4513]">Support</h3>
          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            <li><Link href={{ pathname: "/privacy" }}>Privacy Policy</Link></li>
            <li><Link href={{ pathname: "/terms" }}>Terms</Link></li>
            <li><Link href={{ pathname: "/returns" }}>Returns</Link></li>
            <li><Link href={{ pathname: "/shipping" }}>Shipping</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B4513]">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-stone-600">
            <li className="flex items-center gap-2"><Mail size={16} /> hello@urugo.rw</li>
            <li className="flex items-center gap-2"><Phone size={16} /> +250 788 000 000</li>
          </ul>
          <div className="mt-4 flex gap-3 text-stone-600">
            <Globe size={18} />
            <Sparkles size={18} />
            <Mail size={18} />
          </div>
        </div>
      </div>
    </footer>
  );
}
