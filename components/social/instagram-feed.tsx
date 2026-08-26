"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  link: string;
}

export function InstagramFeed({ username = "urugobuy", limit = 6 }: { username?: string; limit?: number }) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching Instagram posts
    // In a real app, use Instagram Basic Display API
    const mockPosts: InstagramPost[] = [
      {
        id: "1",
        imageUrl: "/images/products/abstract-orange-summer-set.jfif",
        caption: "New arrivals! Check out our latest collection",
        likes: 234,
        link: "https://instagram.com/p/1",
      },
      {
        id: "2",
        imageUrl: "/images/products/electronics-catalog/Apple iPhone 14.jpg",
        caption: "Summer sale is here! Up to 50% off",
        likes: 189,
        link: "https://instagram.com/p/2",
      },
      {
        id: "3",
        imageUrl: "/images/products/home-catalog/Cozy Reading Nook_ Lamp, Chair & Plant Glow.jpg",
        caption: "Customer spotlight: See what our customers are wearing",
        likes: 156,
        link: "https://instagram.com/p/3",
      },
      {
        id: "4",
        imageUrl: "/images/products/beauty-catalog/10344274145708846.jpg",
        caption: "Behind the scenes at Urugo Buy",
        likes: 98,
        link: "https://instagram.com/p/4",
      },
      {
        id: "5",
        imageUrl: "/images/products/sports-catalog/Adidas.jpg",
        caption: "New brand partnership announcement",
        likes: 76,
        link: "https://instagram.com/p/5",
      },
      {
        id: "6",
        imageUrl: "/images/products/tropical-botanical-shirt.jfif",
        caption: "Weekend flash sale - Don't miss out!",
        likes: 245,
        link: "https://instagram.com/p/6",
      },
    ];

    setTimeout(() => {
      setPosts(mockPosts.slice(0, limit));
      setIsLoading(false);
    }, 1000);
  }, [username, limit]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          <svg className="h-6 w-6 text-[#8B4513]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <h3 className="text-lg font-semibold text-stone-900">@{username}</h3>
        </div>
        <a
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-[#8B4513] transition hover:text-[#6d3410]"
        >
          Follow
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded-[20px]"
          >
            <img
              src={post.imageUrl}
              alt={post.caption}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/50">
              <div className="translate-y-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-center text-xs text-white line-clamp-2">{post.caption}</p>
                <p className="mt-1 text-center text-xs text-white/80">❤️ {post.likes}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
