import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Hero Skeleton */}
          <div className="mb-8 h-[400px] w-full animate-pulse rounded-[28px] bg-stone-200" />
          
          {/* Products Grid Skeleton */}
          <div className="mb-8">
            <Skeleton className="mb-4 h-8 w-48" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[300px] w-full rounded-[20px]" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}