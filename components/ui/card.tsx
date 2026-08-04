import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[28px] border border-stone-200/70 bg-white p-5 shadow-[0_20px_80px_-40px_rgba(139,69,19,0.3)]", className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-3", className)}>{children}</div>;
}
