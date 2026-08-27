import ProductDetailPage, {
  generateMetadata as generateProductMetadata,
} from "@/app/products/[slug]/page";
import type { Locale } from "@/lib/locale";

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return generateProductMetadata({ params: Promise.resolve({ slug }) });
}

export default async function LocaleProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailPage params={Promise.resolve({ slug })} />;
}
