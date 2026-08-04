import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", asChild = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-[#8B4513] text-white hover:bg-[#7a3b10]",
      outline: "border border-[#8B4513] text-[#8B4513] hover:bg-[#f8efe7]",
      ghost: "text-[#8B4513] hover:bg-[#f8efe7]",
    };

    const baseClassName = cn(
      "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
      variants[variant],
      className,
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(baseClassName, (children as React.ReactElement<{ className?: string }>).props.className),
        ...(props as Record<string, unknown>),
      });
    }

    return (
      <button
        ref={ref}
        className={baseClassName}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
