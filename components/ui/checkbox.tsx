"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  id,
  name,
}: CheckboxProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      id={id}
      name={name}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
        "focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:ring-offset-2",
        checked
          ? "border-[#8B4513] bg-[#8B4513] text-white"
          : "border-stone-300 bg-white hover:border-[#8B4513]",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {checked && <Check size={14} strokeWidth={3} />}
    </button>
  );
}