import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-full border border-stone-200 bg-white px-4 text-sm outline-none ring-0 transition focus:border-[#8B4513] focus:ring-2 focus:ring-[#8B4513]/20",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };
