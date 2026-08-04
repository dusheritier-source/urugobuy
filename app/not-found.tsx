import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf4] p-8">
      <div className="max-w-md rounded-[32px] border border-stone-200 bg-white p-10 text-center shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#FF8C00]">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">We could not find that page</h1>
        <p className="mt-3 text-sm text-stone-600">The page you are looking for may have moved or no longer exists.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Back home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
