import type { SupportedLanguage } from "@/lib/locale";

const english = {
  home: "Home",
  products: "Products",
  categories: "Categories",
  deals: "Deals",
  about: "About",
  contact: "Contact",
  search: "Search",
  cart: "Cart",
  profile: "Profile",
  language: "Language",
  backToProducts: "Back to products",
  color: "Color",
  size: "Size",
  brand: "Brand",
  colors: "Colors",
  sizes: "Sizes",
  stock: "Stock",
  itemsAvailable: "items available",
  specifications: "Specifications",
  addToCart: "Add to cart",
  addedToCart: "added to cart",
  inStock: "In stock",
  outOfStock: "Out of stock",
  toggleWishlist: "Toggle wishlist",
  shareProduct: "Share product",
  productLinkCopied: "Product link copied",
  loading: "Loading…",
};

export type TranslationKey = keyof typeof english;

const translations: Record<SupportedLanguage, Record<TranslationKey, string>> = {
  en: english,
  rw: {
    home: "Ahabanza", products: "Ibicuruzwa", categories: "Ibyiciro", deals: "Ibiciro byiza", about: "Ibyerekeye", contact: "Twandikire",
    search: "Shakisha", cart: "Agaseke", profile: "Konti", language: "Ururimi", backToProducts: "Subira ku bicuruzwa", color: "Ibara", size: "Ingano",
    brand: "Ikirango", colors: "Amabara", sizes: "Ingano", stock: "Ibihari", itemsAvailable: "mu bubiko", specifications: "Ibisobanuro",
    addToCart: "Ongeramo mu gaseke", addedToCart: "byongewe mu gaseke", inStock: "Birahari", outOfStock: "Ntibihari",
    toggleWishlist: "Hindura ibyo wifuza", shareProduct: "Sangiza iki gicuruzwa", productLinkCopied: "Ihuza ry'igicuruzwa ryakoporowe", loading: "Birimo gutegurwa…",
  },
  fr: {
    home: "Accueil", products: "Produits", categories: "Catégories", deals: "Promotions", about: "À propos", contact: "Contact",
    search: "Rechercher", cart: "Panier", profile: "Profil", language: "Langue", backToProducts: "Retour aux produits", color: "Couleur", size: "Taille",
    brand: "Marque", colors: "Couleurs", sizes: "Tailles", stock: "Stock", itemsAvailable: "articles disponibles", specifications: "Caractéristiques",
    addToCart: "Ajouter au panier", addedToCart: "ajouté au panier", inStock: "En stock", outOfStock: "Rupture de stock",
    toggleWishlist: "Modifier les favoris", shareProduct: "Partager le produit", productLinkCopied: "Lien du produit copié", loading: "Chargement…",
  },
  zh: {
    home: "首页", products: "商品", categories: "分类", deals: "优惠", about: "关于我们", contact: "联系我们",
    search: "搜索", cart: "购物车", profile: "个人资料", language: "语言", backToProducts: "返回商品", color: "颜色", size: "尺寸",
    brand: "品牌", colors: "颜色", sizes: "尺寸", stock: "库存", itemsAvailable: "件可购买", specifications: "商品规格",
    addToCart: "加入购物车", addedToCart: "已加入购物车", inStock: "有货", outOfStock: "缺货",
    toggleWishlist: "切换心愿单", shareProduct: "分享商品", productLinkCopied: "商品链接已复制", loading: "加载中…",
  },
  sw: {
    home: "Nyumbani", products: "Bidhaa", categories: "Vikundi", deals: "Ofa", about: "Kuhusu", contact: "Wasiliana nasi",
    search: "Tafuta", cart: "Kikapu", profile: "Wasifu", language: "Lugha", backToProducts: "Rudi kwa bidhaa", color: "Rangi", size: "Ukubwa",
    brand: "Chapa", colors: "Rangi", sizes: "Ukubwa", stock: "Hifadhi", itemsAvailable: "bidhaa zinapatikana", specifications: "Maelezo ya bidhaa",
    addToCart: "Ongeza kwenye kikapu", addedToCart: "imeongezwa kwenye kikapu", inStock: "Inapatikana", outOfStock: "Haipatikani",
    toggleWishlist: "Badilisha orodha ya matamanio", shareProduct: "Shiriki bidhaa", productLinkCopied: "Kiungo cha bidhaa kimenakiliwa", loading: "Inapakia…",
  },
  ar: {
    home: "الرئيسية", products: "المنتجات", categories: "الفئات", deals: "العروض", about: "من نحن", contact: "اتصل بنا",
    search: "بحث", cart: "السلة", profile: "الملف الشخصي", language: "اللغة", backToProducts: "العودة إلى المنتجات", color: "اللون", size: "المقاس",
    brand: "العلامة التجارية", colors: "الألوان", sizes: "المقاسات", stock: "المخزون", itemsAvailable: "قطع متوفرة", specifications: "المواصفات",
    addToCart: "أضف إلى السلة", addedToCart: "تمت الإضافة إلى السلة", inStock: "متوفر", outOfStock: "غير متوفر",
    toggleWishlist: "تعديل قائمة الأمنيات", shareProduct: "مشاركة المنتج", productLinkCopied: "تم نسخ رابط المنتج", loading: "جارٍ التحميل…",
  },
  es: {
    home: "Inicio", products: "Productos", categories: "Categorías", deals: "Ofertas", about: "Acerca de", contact: "Contacto",
    search: "Buscar", cart: "Carrito", profile: "Perfil", language: "Idioma", backToProducts: "Volver a productos", color: "Color", size: "Talla",
    brand: "Marca", colors: "Colores", sizes: "Tallas", stock: "Existencias", itemsAvailable: "unidades disponibles", specifications: "Especificaciones",
    addToCart: "Añadir al carrito", addedToCart: "añadido al carrito", inStock: "Disponible", outOfStock: "Agotado",
    toggleWishlist: "Cambiar lista de deseos", shareProduct: "Compartir producto", productLinkCopied: "Enlace del producto copiado", loading: "Cargando…",
  },
  pt: {
    home: "Início", products: "Produtos", categories: "Categorias", deals: "Ofertas", about: "Sobre", contact: "Contato",
    search: "Pesquisar", cart: "Carrinho", profile: "Perfil", language: "Idioma", backToProducts: "Voltar aos produtos", color: "Cor", size: "Tamanho",
    brand: "Marca", colors: "Cores", sizes: "Tamanhos", stock: "Estoque", itemsAvailable: "itens disponíveis", specifications: "Especificações",
    addToCart: "Adicionar ao carrinho", addedToCart: "adicionado ao carrinho", inStock: "Em estoque", outOfStock: "Indisponível",
    toggleWishlist: "Alternar lista de desejos", shareProduct: "Compartilhar produto", productLinkCopied: "Link do produto copiado", loading: "Carregando…",
  },
  hi: {
    home: "होम", products: "उत्पाद", categories: "श्रेणियाँ", deals: "ऑफ़र", about: "हमारे बारे में", contact: "संपर्क करें",
    search: "खोजें", cart: "कार्ट", profile: "प्रोफ़ाइल", language: "भाषा", backToProducts: "उत्पादों पर वापस जाएँ", color: "रंग", size: "आकार",
    brand: "ब्रांड", colors: "रंग", sizes: "आकार", stock: "स्टॉक", itemsAvailable: "आइटम उपलब्ध", specifications: "विवरण",
    addToCart: "कार्ट में जोड़ें", addedToCart: "कार्ट में जोड़ा गया", inStock: "स्टॉक में", outOfStock: "स्टॉक में नहीं",
    toggleWishlist: "विशलिस्ट बदलें", shareProduct: "उत्पाद साझा करें", productLinkCopied: "उत्पाद लिंक कॉपी किया गया", loading: "लोड हो रहा है…",
  },
  de: {
    home: "Startseite", products: "Produkte", categories: "Kategorien", deals: "Angebote", about: "Über uns", contact: "Kontakt",
    search: "Suchen", cart: "Warenkorb", profile: "Profil", language: "Sprache", backToProducts: "Zurück zu den Produkten", color: "Farbe", size: "Größe",
    brand: "Marke", colors: "Farben", sizes: "Größen", stock: "Lagerbestand", itemsAvailable: "Artikel verfügbar", specifications: "Spezifikationen",
    addToCart: "In den Warenkorb", addedToCart: "zum Warenkorb hinzugefügt", inStock: "Auf Lager", outOfStock: "Nicht auf Lager",
    toggleWishlist: "Wunschliste ändern", shareProduct: "Produkt teilen", productLinkCopied: "Produktlink kopiert", loading: "Wird geladen…",
  },
};

export function translate(language: SupportedLanguage, key: TranslationKey) {
  return translations[language][key] ?? english[key];
}

export function productContent<T extends { title: string; description: string; translations?: Partial<Record<SupportedLanguage, { title?: string; description?: string }>> }>(product: T, language: SupportedLanguage) {
  const translated = product.translations?.[language];
  return { ...product, title: translated?.title || product.title, description: translated?.description || product.description };
}
