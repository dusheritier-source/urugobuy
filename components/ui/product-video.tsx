"use client";

import { useState } from "react";
import { Play, X, Volume2, VolumeX, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductVideoProps {
  videoUrl: string;
  thumbnailUrl: string;
  className?: string;
}

export function ProductVideo({ videoUrl, thumbnailUrl, className }: ProductVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
  };

  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-[20px] bg-black", className)}>
      {!isPlaying ? (
        <>
          <img
            src={thumbnailUrl}
            alt="Product video thumbnail"
            className="h-full w-full object-cover"
          />
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition hover:bg-black/40"
            aria-label="Play video"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 transition hover:scale-110">
              <Play size={32} className="ml-1 text-[#8B4513]" fill="#8B4513" />
            </div>
          </button>
        </>
      ) : (
        <>
          <video
            src={videoUrl}
            autoPlay
            controls
            controlsList="nodownload"
            className="h-full w-full"
            onEnded={handleClose}
          >
            Your browser does not support the video tag.
          </video>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            aria-label="Close video"
          >
            <X size={20} />
          </button>
        </>
      )}
    </div>
  );
}