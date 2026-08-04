"use client";

import { useState } from "react";
import { Heart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface WishlistButtonProps {
  productId: string;
  initialIsWishlisted?: boolean;
  className?: string;
}

export function WishlistButton({ productId, initialIsWishlisted = false, className }: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isWishlisted) {
      setIsWishlisted(false);
      toast.success("Removed from wishlist");
    } else {
      setIsWishlisted(true);
      toast.success("Added to wishlist! ❤️");
    }
    
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "rounded-full p-3 transition",
        isWishlisted
          ? "bg-red-50 text-red-600 border-2 border-red-200"
          : "border border-stone-200 text-stone-600 hover:border-red-300 hover:text-red-600",
        className
      )}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      {isWishlisted ? <Check size={20} /> : <Heart size={20} />}
    </button>
  );
}