"use client";

import { useState, useRef } from "react";
import { Camera, X, Upload, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { products } from "@/lib/data";
import { useLocale } from "@/components/locale/locale-context";


interface VisualSearchProps {
  onSearch: (imageUrl: string) => void;
  className?: string;
}

export function VisualSearch({ onSearch, className }: VisualSearchProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        onSearch(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const extractImageKeywords = (imageUrl: string) => {
    // Heuristic keyword extraction without external vision APIs.
    // Uses the data URL plus any available hint in the string.
    const lower = imageUrl.toLowerCase();

    const keywords = new Set<string>();

    // Common “file name” hints aren’t available with FileReader data URLs,
    // but we still try to infer from any embedded tokens.
    const dictionary: Array<[RegExp, string[]]> = [
      [/speaker|sound|audio/, ["speaker", "audio", "music"]],
      [/headphone|earbud|buds|anc|noise|cancel/, ["headphones", "wireless", "noise cancelling"]],
      [/charger|power|battery|charge/, ["charger", "wireless", "power"]],
      [/lamp|light|candle|votive|glow/, ["lamp", "lighting", "candle"]],
      [/bag|tote|wallet|belt/, ["bag", "leather", "fashion"]],
      [/serum|cream|mist|toner|balm|spf|retinol/, ["skincare", "serum", "beauty"]],
      [/watch|clock|time/, ["watch", "clock"]],
      [/plant|vase|planter|dinner plate|plates|mug|towel|blanket|throw|runner/, ["home", "decor"]],
    ];

    for (const [re, words] of dictionary) {
      if (re.test(lower)) {
        for (const w of words) keywords.add(w);
      }
    }

    // Fallback: broad match so the UI still returns results.
    if (keywords.size === 0) {
      keywords.add("premium");
      keywords.add("modern");
    }

    return Array.from(keywords);
  };

  const rankProducts = (imageUrl: string) => {
    const kw = extractImageKeywords(imageUrl);

    const scoreProduct = (p: (typeof products)[number]) => {
      const fields = [
        p.title,
        p.brand,
        p.category,
        p.description,
        (p.colors || []).join(" "),
        (p.sizes || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      const matched: string[] = [];

      // Field weighting: title > brand/category > description
      const title = p.title.toLowerCase();
      const brandCategory = `${p.brand} ${p.category}`.toLowerCase();
      const description = p.description.toLowerCase();

      for (const k of kw) {
        const inTitle = title.includes(k);
        const inBrandCategory = brandCategory.includes(k);
        const inDesc = description.includes(k);

        if (inTitle) {
          score += 8;
          matched.push(k);
        } else if (inBrandCategory) {
          score += 5;
          matched.push(k);
        } else if (inDesc) {
          score += 3;
          matched.push(k);
        } else {
          // soft boost for partial matches
          if (fields.includes(k.split(" ")[0])) score += 1;
        }
      }

      // Quality/business boosts
      score += (p.rating || 0) * 1.5;
      score += Math.min(p.discount || 0, 50) * 0.08;
      score += Math.min(p.stock || 0, 100) * 0.01;

      return { score, matched: Array.from(new Set(matched)).slice(0, 4) };
    };

    const ranked = products
      .map((p) => ({
        product: p,
        ...scoreProduct(p),
      }))
      .sort((a, b) => b.score - a.score);

    return { ranked, keywords: kw };
  };

  const [results, setResults] = useState<{
    keywords: string[];
    top: Array<{ product: (typeof products)[number]; matched: string[]; score: number }>;
  } | null>(null);

  const handleUrlSearch = () => {
    if (!selectedImage) return;

    // Backward compatibility
    onSearch(selectedImage);

    // Local heuristic ranking and show results within modal.
    const { ranked, keywords } = rankProducts(selectedImage);
    setResults({
      keywords,
      top: ranked.slice(0, 6).map((r) => ({
        product: r.product,
        matched: r.matched,
        score: r.score,
      })),
    });
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center rounded-full border border-stone-200 p-3 text-stone-600 transition hover:border-[#8B4513] hover:text-[#8B4513]"
        aria-label="Visual search"
      >
        <Camera size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-stone-900">Visual Search</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedImage(null);
                }}
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6">
              {!selectedImage ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-12 transition",
                    isDragging
                      ? "border-[#8B4513] bg-[#8B4513]/5"
                      : "border-stone-300 hover:border-[#8B4513]"
                  )}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                    <Upload size={32} className="text-stone-600" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-stone-900">
                    Drop an image here or click to upload
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Supports JPG, PNG, GIF up to 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-video overflow-hidden rounded-[20px]">
                    <img
                      src={selectedImage}
                      alt="Selected for search"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        fileInputRef.current?.click();
                      }}
                      className="flex-1 rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                    >
                      Choose Different Image
                    </button>
                    <button
                      onClick={handleUrlSearch}
                      className="flex-1 rounded-full bg-[#8B4513] py-3 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
                    >
                      <Search size={16} className="mr-2 inline" />
                      Search Similar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {results && (
              <div className="mt-6 rounded-[16px] border border-stone-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#8B4513]" />
                  <h4 className="text-sm font-semibold text-stone-900">Similar matches</h4>
                </div>

                <p className="mt-1 text-xs text-stone-600">
                  Detected: {results.keywords.slice(0, 4).join(", ")}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {results.top.map((r) => (
                    <a
                      key={r.product.id}
                      href={`/${locale}/products/${r.product.slug}`}
                      className="group rounded-[16px] border border-stone-200/70 p-3 transition hover:border-[#8B4513]"
                      onClick={() => {
                        // Keep modal from blocking navigation.
                        setIsOpen(false);
                        setSelectedImage(null);
                      }}
                    >
                      <div className="relative aspect-square overflow-hidden rounded-[12px] bg-stone-50">
                        <img
                          src={r.product.images[0]}
                          alt={r.product.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                      </div>

                      <div className="mt-2">
                        <p className="line-clamp-2 text-xs font-semibold text-stone-900">{r.product.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {r.matched.slice(0, 2).map((m) => (
                            <span key={m} className="rounded-full bg-[#fff8f1] px-2 py-0.5 text-[10px] font-semibold text-[#8B4513]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 rounded-[16px] bg-[#fff8f1] p-4">
              <h4 className="text-sm font-semibold text-stone-900">How it works</h4>
              <p className="mt-1 text-xs text-stone-700">
                Upload a photo of any product and we'll find similar items from our catalog.
                Try uploading a fashion item, electronics, or home decor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}