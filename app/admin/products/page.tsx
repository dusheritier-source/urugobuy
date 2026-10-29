import { publishedProducts } from "@/lib/server/catalog";
import { ProductManager } from "./product-manager";

export const metadata = { title: "Product management | Urugo Buy" };

export default async function AdminProductsPage() {
  const products = await publishedProducts();
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Catalog administration</p><h1 className="mt-2 text-3xl font-semibold">Products</h1><p className="mt-2 text-stone-600 dark:text-stone-300">Save drafts locally, then Publish to store to update live products and trigger price-drop alerts.</p></div><ProductManager seedProducts={products} /></main>;
}
