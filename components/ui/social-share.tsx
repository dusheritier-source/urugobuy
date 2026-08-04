"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
}

export function SocialShare({ url, title, description, image, className }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    url: typeof window !== "undefined" ? window.location.origin + url : url,
    title,
    description,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.description,
          url: shareData.url,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const socialPlatforms = [
    {
      name: "Facebook",
      icon: () => (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: "bg-blue-600 hover:bg-blue-700",
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
    },
    {
      name: "Twitter",
      icon: () => (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.978 4.978 0 00-8.486 4.543A14.016 14.016 0 011.64 3.162a4.98 4.98 0 001.535 6.633 4.98 4.98 0 01-2.212-.548v.052a4.978 4.978 0 003.99 4.878 5.007 5.007 0 01-2.212.085 4.986 4.986 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      color: "bg-sky-500 hover:bg-sky-600",
      shareUrl: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.title)}`,
    },
    {
      name: "WhatsApp",
      icon: () => (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: "bg-green-500 hover:bg-green-600",
      shareUrl: `https://wa.me/?text=${encodeURIComponent(shareData.title + " " + shareData.url)}`,
    },
  ];

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#8B4513] hover:text-[#8B4513]"
      >
        <Share2 size={16} />
        Share
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 flex items-center gap-2 rounded-[20px] border border-stone-200/70 bg-white p-3 shadow-xl">
          {socialPlatforms.map((platform) => (
            <a
              key={platform.name}
              href={platform.shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-white transition",
                platform.color
              )}
              aria-label={`Share on ${platform.name}`}
            >
              <platform.icon />
            </a>
          ))}
          
          <button
            onClick={handleCopyLink}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition hover:bg-stone-200"
            aria-label="Copy link"
          >
            {copied ? <Check size={18} /> : <Link2 size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}