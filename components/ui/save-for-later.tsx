"use client";

import { useState } from "react";
import { Bookmark, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface SaveForLaterProps {
  productId: string;
  initialIsSaved?: boolean;
  className?: string;
}

export function SaveForLater({ productId, initialIsSaved = false, className }: SaveForLaterProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isSaved) {
      setIsSaved(false);
      toast.success("Removed from saved items");
    } else {
      setIsSaved(true);
      toast.success("Saved for later! 🔖");
    }
    
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
        isSaved
          ? "bg-[#8B4513]/10 text-[#8B4513] border-2 border-[#8B4513]"
          : "border border-stone-200 text-stone-600 hover:border-[#8B4513] hover:text-[#8B4513]",
        className
      )}
      aria-label={isSaved ? "Remove from saved items" : "Save for later"}
    >
      {isSaved ? <Check size={16} /> : <Bookmark size={16} />}
      {isSaved ? "Saved" : "Save for Later"}
    </button>
  );
}