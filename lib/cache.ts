// Caching utilities for API responses and data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  set<T>(key: string, data: T, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new Cache();

// Helper function to get cached data
export function getCachedData<T>(key: string, fetcher: () => Promise<T>, ttl: number = 3600000): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  // Fetch and cache
  return fetcher().then((data) => {
    cache.set(key, data, ttl);
    return data;
  });
}

// Helper function to invalidate cache
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }

  // Delete all keys matching pattern
  for (const key of (cache as unknown as { cache: Map<string, unknown> }).cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  USER_PROFILE: "user_profile",
  CART: "cart",
  WISHLIST: "wishlist",
  ORDERS: "orders",
} as const;