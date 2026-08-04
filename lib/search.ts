export type SearchableProduct = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  category: string;
  description: string;
  colors?: string[];
  sizes?: string[];
  rating?: number;
  discount?: number;
  stock?: number;
};

export type SearchResult<T extends SearchableProduct> = {
  product: T;
  score: number;
  matchedTokens: string[];
};

const normalize = (input: string) =>
  input
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenize = (input: string) => {
  const n = normalize(input);
  if (!n) return [];
  return n.split(/\s+/g).filter(Boolean);
};

// Lightweight token similarity: exact include OR prefix OR edit-distance-ish via subsequence.
// This is intentionally simple (no external deps) but feels more like "Alibaba" than includes().
const isTokenMatch = (needle: string, haystack: string) => {
  if (!needle || !haystack) return false;
  const h = haystack;
  // exact token substring
  if (h.includes(needle)) return true;
  // prefix match ("spkr" -> "speaker")
  if (needle.length >= 3 && h.includes(needle.slice(0, Math.min(6, needle.length)))) return true;
  // subsequence match (tolerates some missing letters)
  let i = 0;
  for (const ch of h) {
    if (ch === needle[i]) i++;
    if (i >= needle.length) return true;
  }
  return false;
};

const scoreTokenInField = (token: string, field: string) => {
  const f = field;
  if (!token) return 0;
  if (f === token) return 25;
  if (f.includes(token)) return 18;
  if (token.length >= 3 && f.includes(token.slice(0, Math.min(6, token.length)))) return 10;
  if (isTokenMatch(token, f)) return 7;
  return 0;
};

export function searchProducts<T extends SearchableProduct>(
  products: T[],
  query: string,
  options?: {
    limit?: number;
  }
): SearchResult<T>[] {
  const limit = options?.limit ?? 20;
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return products
      .slice()
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, limit)
      .map((p) => ({ product: p, score: 0, matchedTokens: [] }));
  }

  const scored: SearchResult<T>[] = [];

  for (const p of products) {
    const title = normalize(p.title);
    const brand = normalize(p.brand);
    const category = normalize(p.category);
    const description = normalize(p.description);
    const colors = normalize((p.colors || []).join(" "));
    const sizes = normalize((p.sizes || []).join(" "));

    const matched: string[] = [];
    let score = 0;

    for (const token of tokens) {
      // Title is most important.
      const sTitle = scoreTokenInField(token, title);
      if (sTitle > 0) matched.push(token);
      score += sTitle * 1.9;

      // Brand/category next.
      score += scoreTokenInField(token, brand) * 1.3;
      score += scoreTokenInField(token, category) * 1.3;

      // Description then attributes.
      score += scoreTokenInField(token, description) * 0.9;
      score += scoreTokenInField(token, colors) * 0.7;
      score += scoreTokenInField(token, sizes) * 0.6;
    }

    // Business boosts (small but help ranking feel "smart").
    score += (p.rating ?? 0) * 1.2;
    score += Math.min(p.discount ?? 0, 80) * 0.06;
    score += Math.min(p.stock ?? 0, 200) * 0.004;

    // If nothing matched at all, penalize heavily so "no results" still possible.
    if (matched.length === 0) score -= 100;

    scored.push({ product: p, score, matchedTokens: Array.from(new Set(matched)) });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((r) => r.score > 0)
    .slice(0, limit);
}

export function getSearchSuggestions<T extends SearchableProduct>(
  products: T[],
  query: string,
  limit = 5
) {
  return searchProducts(products, query, { limit }).map((r) => ({
    id: r.product.id,
    slug: r.product.slug,
    title: r.product.title,
  }));
}

