import { BadgeCheck, Compass, ShieldCheck, Sparkles } from "lucide-react";

const points = [
  { title: "Curated discovery", description: "Thoughtfully selected products that balance style, utility, and value.", icon: Sparkles },
  { title: "Trusted delivery", description: "Fast, transparent fulfillment with a premium post-purchase experience.", icon: Compass },
  { title: "Secure checkout", description: "Protected payments and reliable support at every stage of the journey.", icon: ShieldCheck },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[36px] border border-stone-200/70 bg-gradient-to-br from-[#fff8f1] to-white p-8 shadow-[0_30px_90px_-45px_rgba(139,69,19,0.3)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">About Urugo Buy</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">Building a refined shopping experience for Rwanda.</h1>
        <p className="mt-4 max-w-3xl text-lg text-stone-600">Urugo Buy is a modern, premium storefront that reimagines online commerce with polished design, efficient browsing, and a human-centered shopping journey.</p>
      </section>
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {points.map((point) => {
          const Icon = point.icon;
          return (
            <div key={point.title} className="rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8f1] text-[#8B4513]">
                <Icon size={20} />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-stone-900">{point.title}</h2>
              <p className="mt-2 text-sm text-stone-600">{point.description}</p>
            </div>
          );
        })}
      </section>
      <section className="mt-8 rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-sm">
        <div className="flex items-center gap-2 text-[#8B4513]">
          <BadgeCheck size={18} />
          <p className="font-semibold">Why choose us</p>
        </div>
        <p className="mt-3 text-stone-600">From fast discovery to carefully crafted product presentation, every detail is designed to feel luxurious, reassuring, and easy to use.</p>
      </section>
    </main>
  );
}
