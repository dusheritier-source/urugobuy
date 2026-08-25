import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },
  poweredByHeader: false,
  async headers() {
    const scriptPolicy = process.env.NODE_ENV === "production" ? "'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms" : "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms";
    return [{ source: "/(.*)", headers: [
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src ${scriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com https://www.google-analytics.com https://storage.googleapis.com https://firebasestorage.googleapis.com; font-src 'self' data:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.google-analytics.com https://*.clarity.ms; frame-src 'self' https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`, },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
    ] }];
  },
};

export default nextConfig;
