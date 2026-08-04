// Performance utilities and configurations

export const PERFORMANCE_CONFIG = {
  // Image optimization
  imageSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  defaultImageQuality: 75,
  
  // Caching
  cacheMaxAge: 3600, // 1 hour
  staleWhileRevalidate: 86400, // 24 hours
  
  // API
  apiTimeout: 10000, // 10 seconds
  retryAttempts: 3,
  
  // Bundle splitting
  dynamicBundleSize: 100, // KB
  
  // Fonts
  fontDisplay: "swap",
  fontPreload: ["Geist", "Geist_Mono"],
};

export const criticalResources = {
  fonts: [
    { family: "Geist", weight: "400", display: "swap" },
    { family: "Geist", weight: "500", display: "swap" },
    { family: "Geist", weight: "600", display: "swap" },
    { family: "Geist", weight: "700", display: "swap" },
  ],
  images: [
    "/images/hero-bg.webp",
    "/images/logo.webp",
  ],
};

export function calculatePerformanceScore() {
  return {
    fcp: 0, // First Contentful Paint
    lcp: 0, // Largest Contentful Paint
    fid: 0, // First Input Delay
    cls: 0, // Cumulative Layout Shift
    ttfb: 0, // Time to First Byte
  };
}

export function optimizeImages() {
  return {
    enableWebP: true,
    enableAVIF: true,
    responsiveSizes: [640, 750, 828, 1080, 1200, 1920],
    placeholder: "blur",
    blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC3AB8A",
  };
}