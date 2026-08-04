import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-stone-200 dark:bg-stone-700",
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-sm">
      <Skeleton className="aspect-square w-full rounded-[20px]" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-stone-200/70 bg-white p-4 shadow-sm">
      <Skeleton className="aspect-video w-full rounded-[20px]" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}