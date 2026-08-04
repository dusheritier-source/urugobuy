import type { Locale } from "@/lib/locale";
import ProductsPage from "@/app/products/page";

type Props = { params: Promise<{ locale: Locale }>; searchParams?: Promise<{ category?: string; q?: string }> };



export default function LocaleProductsPage(props: Props) {
  return <ProductsPage searchParams={props.searchParams} />;
}

