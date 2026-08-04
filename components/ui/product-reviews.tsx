"use client";

import { useState } from "react";
import { Star, ThumbsUp, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  images?: string[];
  isVerified: boolean;
  helpful?: number;
}

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  className?: string;
}

type SortOption = "recent" | "helpful" | "highest" | "lowest";
type FilterOption = "all" | "with-photos" | "verified";

export function ProductReviews({ reviews, averageRating, totalReviews, className }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedReviews = reviews
    .filter((review) => {
      if (filterBy === "with-photos") return review.images && review.images.length > 0;
      if (filterBy === "verified") return review.isVerified;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "helpful":
          return (b.helpful || b.likes) - (a.helpful || a.likes);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "recent":
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { star, count, percentage };
  });

  return (
    <div className={cn("rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm", className)}>
      <h3 className="text-xl font-semibold text-stone-900">Customer Reviews</h3>

      {/* Rating Overview */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-stone-900">{averageRating.toFixed(1)}</span>
            <span className="text-lg text-stone-600">out of 5</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={cn(
                  i < Math.floor(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-stone-300 text-stone-300"
                )}
              />
            ))}
          </div>
          <p className="mt-1 text-sm text-stone-600">{totalReviews} reviews</p>
        </div>

        <div className="space-y-2">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-sm text-stone-600 w-8">{star}</span>
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-stone-600 w-12 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-medium text-stone-700 transition hover:text-[#8B4513]"
        >
          <Filter size={16} />
          Filters
          <ChevronDown size={16} className={cn("transition-transform", showFilters && "rotate-180")} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-[#8B4513]"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilterBy("all")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filterBy === "all"
                ? "bg-[#8B4513] text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            )}
          >
            All Reviews
          </button>
          <button
            onClick={() => setFilterBy("with-photos")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filterBy === "with-photos"
                ? "bg-[#8B4513] text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            )}
          >
            With Photos
          </button>
          <button
            onClick={() => setFilterBy("verified")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              filterBy === "verified"
                ? "bg-[#8B4513] text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            )}
          >
            Verified Purchase
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {filteredAndSortedReviews.map((review) => (
          <div key={review.id} className="rounded-[20px] border border-stone-200/70 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-900">{review.author}</span>
                  {review.isVerified && (
                    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={cn(
                        i < review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-stone-300 text-stone-300"
                      )}
                    />
                  ))}
                  <span className="ml-2 text-sm text-stone-600">{review.date}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-stone-700">{review.comment}</p>

            {review.images && review.images.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {review.images.map((image, index) => (
                  <div
                    key={index}
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg"
                  >
                    <img
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4">
              <button className="flex items-center gap-1 text-sm text-stone-600 transition hover:text-[#8B4513]">
                <ThumbsUp size={16} />
                <span>Helpful ({review.helpful || review.likes})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedReviews.length === 0 && (
        <div className="mt-6 text-center py-8">
          <p className="text-stone-600">No reviews match your filters.</p>
        </div>
      )}
    </div>
  );
}