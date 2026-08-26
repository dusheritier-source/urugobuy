"use client";

import { useState, useEffect } from "react";
import { Users, Upload, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface UGCPost {
  id: string;
  imageUrl: string;
  customerName: string;
  productName: string;
  likes: number;
  comments: number;
  verified: boolean;
}

export function UGCGallery({ limit = 8 }: { limit?: number }) {
  const [posts, setPosts] = useState<UGCPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<UGCPost | null>(null);

  useEffect(() => {
    // Simulate fetching user-generated content
    const mockPosts: UGCPost[] = [
      {
        id: "1",
        imageUrl: "/images/products/sky-blue-pleated-set.jfif",
        customerName: "Sarah M.",
        productName: "Summer Dress",
        likes: 45,
        comments: 12,
        verified: true,
      },
      {
        id: "2",
        imageUrl: "/images/products/electronics-catalog/JBL high sond headphone.jpg",
        customerName: "Jean P.",
        productName: "Leather Bag",
        likes: 32,
        comments: 8,
        verified: true,
      },
      {
        id: "3",
        imageUrl: "/images/products/home-catalog/Cozy Reading Nook_ Lamp, Chair & Plant Glow.jpg",
        customerName: "Marie C.",
        productName: "Sneakers",
        likes: 67,
        comments: 15,
        verified: true,
      },
      {
        id: "4",
        imageUrl: "/images/products/beauty-catalog/604749056260656794.jpg",
        customerName: "Eric K.",
        productName: "Watch",
        likes: 28,
        comments: 6,
        verified: false,
      },
      {
        id: "5",
        imageUrl: "/images/products/sports-catalog/Fitness Gloves.jpg",
        customerName: "Alice N.",
        productName: "Sunglasses",
        likes: 54,
        comments: 11,
        verified: true,
      },
      {
        id: "6",
        imageUrl: "/images/products/island-print-summer-set.jpg",
        customerName: "David H.",
        productName: "Backpack",
        likes: 41,
        comments: 9,
        verified: true,
      },
      {
        id: "7",
        imageUrl: "/images/products/home-catalog/Interiors 247.jpg",
        customerName: "Grace L.",
        productName: "Earrings",
        likes: 38,
        comments: 7,
        verified: false,
      },
      {
        id: "8",
        imageUrl: "/images/products/sports-catalog/WILSON NBA Authentic Series Outdoor Basketballs.jpg",
        customerName: "Paul R.",
        productName: "Jacket",
        likes: 52,
        comments: 14,
        verified: true,
      },
    ];

    setTimeout(() => {
      setPosts(mockPosts.slice(0, limit));
      setIsLoading(false);
    }, 800);
  }, [limit]);

  const handleUpload = () => {
    toast.success("Upload feature coming soon!");
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-[20px] bg-stone-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={24} className="text-[#8B4513]" />
          <h3 className="text-lg font-semibold text-stone-900">Customer Photos</h3>
        </div>
        <button
          onClick={handleUpload}
          className="flex items-center gap-2 rounded-full bg-[#8B4513] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
        >
          <Upload size={16} />
          Upload Photo
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="group cursor-pointer overflow-hidden rounded-[20px] border border-stone-200 bg-white transition hover:shadow-lg"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={post.imageUrl}
                alt={`Photo by ${post.customerName}`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Heart size={14} className="text-red-500" />
                  <span className="text-xs text-stone-600">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={14} className="text-stone-500" />
                  <span className="text-xs text-stone-600">{post.comments}</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <p className="text-xs font-medium text-stone-900">{post.customerName}</p>
                {post.verified && (
                  <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="mt-1 text-xs text-stone-600">with {post.productName}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="max-h-[90vh] max-w-4xl overflow-auto rounded-[28px] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-stone-900">Photo by {selectedPost.customerName}</h3>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-4">
              <img
                src={selectedPost.imageUrl}
                alt={`Photo by ${selectedPost.customerName}`}
                className="w-full rounded-[20px]"
              />
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Heart size={20} className="text-red-500" />
                  <span className="font-medium text-stone-900">{selectedPost.likes} likes</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={20} className="text-stone-500" />
                  <span className="font-medium text-stone-900">{selectedPost.comments} comments</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-stone-600">
                <span className="font-semibold">{selectedPost.customerName}</span> with{" "}
                <span className="font-semibold">{selectedPost.productName}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
