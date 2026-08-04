import { products } from "@/lib/data";
import { ProductManager } from "./product-manager";

export const metadata = { title: "Product management | Urugo Buy" };

export default function AdminProductsPage() {
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Catalog administration</p><h1 className="mt-2 text-3xl font-semibold">Products</h1><p className="mt-2 text-stone-600 dark:text-stone-300">Create, update, duplicate, archive, import, and export your storefront catalog.</p></div><ProductManager seedProducts={products} /></main>;
}
