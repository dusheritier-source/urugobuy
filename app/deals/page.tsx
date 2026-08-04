import { products } from "@/lib/data";

export default function DealsPage() {
  const deals = products.filter((product) => product.discount >= 12);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-stone-200/70 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Deals</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Special offers for this week</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {deals.map((product) => (
            <div key={product.id} className="rounded-[28px] border border-stone-200/70 p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8B4513]">Save {product.discount}%</p>
              <h2 className="mt-2 text-lg font-semibold text-stone-900">{product.title}</h2>
              <p className="mt-2 text-sm text-stone-600">{product.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
