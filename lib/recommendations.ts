import type { Product } from "@/types";
import { sellingPrice } from "./product-pricing.mjs";

export type Recommendation = { product: Product; reason: string };
const clean = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const stop = new Set("the and with for from premium modern new set piece pack black white grey gray silver gold blue red green pink natural inch standard wireless stainless steel everyday urugo".split(" "));
const tokens = (product: Product) => new Set(clean(product.title).split(/[^a-z0-9]+/).filter((word) => word.length > 2 && !stop.has(word)));
const sameCategory = (a: Product, b: Product) => clean(a.category) === clean(b.category);
const unique = (products: Product[]) => [...new Map(products.map((product) => [product.id, product])).values()];

// Product-type rules describe catalog relationships; they do not claim purchase history.
const types: Record<string, Array<[string, RegExp]>> = {
  electronics: [
    ["phone-case", /phone.*case|case.*iphone/], ["power-bank", /power bank/], ["charger", /charger|charging pad|charging station/],
    ["headphones", /headphone|earphone|earbud|headset/], ["phone", /iphone|smartphone|mobile phone/],
    ["controller", /controller|gamepad/], ["console", /playstation|ps4|ps5|xbox|nintendo|gaming console/],
    ["keyboard", /keyboard/], ["mouse", /mouse/], ["speaker", /speaker/], ["watch", /watch/], ["camera", /camera|gimbal/],
  ],
  home: [
    ["light", /lamp|light|pendant|lantern/], ["cushion", /cushion|pillow|throw blanket/], ["chair", /chair|sofa/],
    ["vase", /vase|planter/], ["shelf", /shelf|shelving/], ["kettle", /kettle|coffee maker/],
    ["tableware", /mug|cup\b|plate|dinnerware|cutlery|chopstick/], ["tongs", /tong|spatula/],
    ["pan", /frying pan|skillet/], ["pot", /pressure cooker|cooking pot|saucepan/],
    ["cutting-board", /chopping board|cutting board/], ["knife", /knife|kitchen shears/], ["blender", /blender|processor/],
  ],
  beauty: [
    ["headband", /headband/], ["brush", /powder brush|makeup brush/], ["sponge", /sponge/],
    ["makeup", /concealer|foundation|face powder|blush|contour/], ["hair", /hair brush|hairbrush|shampoo|conditioner/],
    ["skincare", /serum|sunscreen|spf|cleanser|skincare|moisturi|body polish|body lotion/],
  ],
  sport: [
    ["bottle", /water bottle|sports bottle|hydration bottle/], ["mat", /yoga mat|exercise mat|fitness mat/],
    ["weights", /dumbbell|kettlebell|weight set|resistance band/], ["sportswear", /legging|sports bra|training shirt|shorts|jersey/],
    ["shoes", /shoe|sneaker|trainer/], ["bag", /gym bag|duffel/],
  ],
  fashion: [["shoes", /shoe|sneaker|boot|loafer/], ["bag", /bag|tote|backpack/], ["top", /shirt|blouse|sweater|jacket/], ["trousers", /trouser|jeans|pants/]],
};
export function productType(product: Product): string | null {
  const category = clean(product.category);
  const group = category.includes("home") ? "home" : category.includes("sport") ? "sport" : category;
  return types[group]?.find(([, pattern]) => pattern.test(clean(product.title)))?.[0] ?? null;
}
const typeLabels: Record<string, string> = {
  "phone-case": "phone cases", "power-bank": "power banks", charger: "charging accessories", headphones: "audio options", phone: "phones", console: "gaming consoles", controller: "controllers", keyboard: "keyboards", mouse: "computer mice", speaker: "speakers", watch: "watches", camera: "camera gear",
  light: "lighting options", cushion: "soft furnishings", chair: "seating options", vase: "decorative accents", shelf: "storage options", kettle: "hot-drink essentials", tableware: "tableware", tongs: "cooking utensils", pan: "frying pans", pot: "cookware", "cutting-board": "chopping boards", knife: "kitchen tools", blender: "blenders",
  headband: "skincare headbands", brush: "makeup brushes", sponge: "makeup sponges", makeup: "makeup options", hair: "hair-care options", skincare: "skincare options", bottle: "hydration essentials", mat: "exercise mats", weights: "training equipment", sportswear: "sportswear", shoes: "footwear", bag: "bags", top: "tops", trousers: "trousers",
};
function overlap(a: Product, b: Product) {
  const aTokens = tokens(a), bTokens = tokens(b);
  return [...aTokens].filter((token) => bTokens.has(token)).length;
}
function relevance(current: Product, candidate: Product) {
  const type = productType(current);
  const sameType = Boolean(type && type === productType(candidate));
  const common = overlap(current, candidate);
  const ratio = Math.abs(Math.log((sellingPrice(candidate) + 1) / (sellingPrice(current) + 1)));
  return (sameCategory(current, candidate) ? 10 : 0) + (sameType ? 35 : 0) + common * 5 +
    (clean(current.brand) === clean(candidate.brand) ? 2 : 0) + Math.max(0, 4 - ratio * 3) + candidate.rating / 5;
}
function ranked<T extends { product: Product; score: number }>(items: T[]) {
  return items.sort((a, b) => b.score - a.score || b.product.rating - a.product.rating || a.product.id.localeCompare(b.product.id));
}
export function relatedProducts(products: Product[], currentId: string, limit = 4): Recommendation[] {
  const catalog = unique(products);
  const current = catalog.find((product) => product.id === currentId);
  if (!current) return [];
  return ranked(catalog.filter((product) => product.id !== currentId && product.stock > 0 && sameCategory(current, product))
    .map((product) => ({ product, score: relevance(current, product) })))
    .slice(0, Math.max(0, limit)).map(({ product }) => ({ product,
      reason: productType(current) && productType(current) === productType(product)
        ? `More ${typeLabels[productType(product)!] ?? product.category.toLowerCase()}` : `More in ${product.category}`,
    }));
}

const complements: Record<string, Array<[string, string]>> = {
  phone: [["charger", "Charging option — check connector compatibility"], ["power-bank", "Portable charging — check compatibility"], ["headphones", "Audio for your setup — check connectivity"]],
  console: [["controller", "For gaming — check console compatibility"], ["headphones", "Gaming audio — check connectivity"]],
  keyboard: [["mouse", "Complete your desk setup"]], mouse: [["keyboard", "Complete your desk setup"]],
  chair: [["cushion", "Add a soft finishing touch"], ["light", "Lighting for your reading corner"]],
  light: [["vase", "A decorative finishing touch"]], shelf: [["vase", "An accent for your shelf"]],
  kettle: [["tableware", "For serving drinks and meals"]], pan: [["tongs", "For turning and serving food"]], pot: [["tongs", "For preparing and serving food"]],
  knife: [["cutting-board", "For food preparation"]], "cutting-board": [["knife", "For food preparation"]],
  makeup: [["brush", "For makeup application"], ["sponge", "For blending makeup"]], brush: [["sponge", "Another way to blend makeup"]],
  skincare: [["headband", "Keep hair back during your routine"]], headband: [["skincare", "For your skincare routine"]],
  weights: [["mat", "For floor exercises"], ["bottle", "Keep water close during training"]], mat: [["bottle", "Keep water close during training"]],
  sportswear: [["bottle", "Hydration for your workout"], ["bag", "Carry your training essentials"]], shoes: [["bag", "Carry your essentials"]],
};
export function complementaryProducts(products: Product[], currentId: string, limit = 2): Recommendation[] {
  const catalog = unique(products);
  const current = catalog.find((product) => product.id === currentId);
  if (!current || current.stock < 1) return [];
  const rules = complements[productType(current) ?? ""] ?? [];
  const choices: Recommendation[] = [];
  for (const [type, reason] of rules) {
    const candidates = catalog.filter((product) => product.id !== currentId && product.stock > 0 && productType(product) === type &&
      // Do not infer compatibility from a matching word in another department.
      (sameCategory(current, product) || (type === "bottle" && clean(product.category).includes("sport"))));
    const best = ranked(candidates.map((product) => ({ product, score: product.rating + Math.max(0, 2 - sellingPrice(product) / Math.max(1, sellingPrice(current))) })))[0];
    if (best && !choices.some((choice) => choice.product.id === best.product.id)) choices.push({ product: best.product, reason });
    if (choices.length >= Math.max(0, limit)) break;
  }
  return limit > 0 ? choices : [];
}
export function recentlyViewedProducts(products: Product[], history: string[], excludeId?: string, limit = 4): Product[] {
  const catalog = new Map(products.map((product) => [product.id, product]));
  return [...new Set(history)].filter((id) => id !== excludeId).flatMap((id) => catalog.get(id) ? [catalog.get(id)!] : []).slice(0, Math.max(0, limit));
}
export function personalizedProducts(products: Product[], history: string[], cartIds: string[] = [], limit = 6): Recommendation[] {
  const catalog = unique(products);
  const anchors = recentlyViewedProducts(catalog, history, undefined, 6);
  const excluded = new Set([...history, ...cartIds]);
  const candidates = catalog.filter((product) => product.stock > 0 && !excluded.has(product.id));
  const scores = ranked(candidates.map((product) => ({ product, score: anchors.length
    ? anchors.reduce((sum, anchor, index) => sum + relevance(anchor, product) / (index + 1), 0)
    : product.rating * 3 + Math.min(product.discount, 40) * 0.025 })));
  const result: Recommendation[] = [];
  const perType = new Map<string, number>();
  for (const { product } of scores) {
    const type = productType(product) ?? clean(product.category);
    if ((perType.get(type) ?? 0) >= 2 && candidates.length > limit) continue;
    perType.set(type, (perType.get(type) ?? 0) + 1);
    result.push({ product, reason: anchors.some((anchor) => sameCategory(anchor, product)) ? "Inspired by your recent browsing" : "Highly rated in our catalog" });
    if (result.length >= Math.max(0, limit)) break;
  }
  return limit > 0 ? result : [];
}
