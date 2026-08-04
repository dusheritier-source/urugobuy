"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUpload: (imageUrl: string) => void;
  className?: string;
}

export function ProfilePictureUpload({ currentImageUrl, onUpload, className }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setIsUploading(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onUpload(previewUrl);
    toast.success("Profile picture updated!");
    setIsUploading(false);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-6">
        {/* Profile Picture Preview */}
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-stone-200">
                <Camera size={32} className="text-stone-400" />
              </div>
            )}
          </div>
          {previewUrl && (
            <button
              onClick={handleRemove}
              className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white shadow-md transition hover:bg-red-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-[#8B4513] hover:text-[#8B4513]"
          >
            <Upload size={16} />
            Choose Photo
          </button>
          <p className="mt-2 text-xs text-stone-500">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </div>

      {previewUrl && previewUrl !== currentImageUrl && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="flex items-center gap-2 rounded-full bg-[#8B4513] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d3410] disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Uploading...
            </>
          ) : (
            <>
              <Check size={16} />
              Save Photo
            </>
          )}
        </button>
      )}
    </div>
  );
}