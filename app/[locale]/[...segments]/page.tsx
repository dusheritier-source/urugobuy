import AboutPage from "@/app/about/page";
import CategoriesPage from "@/app/categories/page";
import ContactPage from "@/app/contact/page";
import DealsPage from "@/app/deals/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import LoginPage from "@/app/login/page";
import PrivacyPage from "@/app/privacy/page";
import ProfilePage from "@/app/profile/page";
import EmailPreferencesPage from "@/app/profile/email-preferences/page";
import PaymentMethodsPage from "@/app/profile/payment-methods/page";
import PriceAlertsPage from "@/app/profile/price-alerts/page";
import RewardsPage from "@/app/profile/rewards/page";
import WishlistPage from "@/app/profile/wishlist/page";
import RegisterPage from "@/app/register/page";
import ReturnsPage from "@/app/returns/page";
import ShippingPage from "@/app/shipping/page";
import TermsPage from "@/app/terms/page";
import CheckoutPage from "@/app/checkout/page";
import PaymentReturnPage from "@/app/checkout/payment-return/page";
import CheckoutSuccessPage from "@/app/checkout/success/page";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";

const localizedPages: Record<string, ComponentType> = {
  about: AboutPage,
  categories: CategoriesPage,
  contact: ContactPage,
  deals: DealsPage,
  "forgot-password": ForgotPasswordPage,
  login: LoginPage,
  privacy: PrivacyPage,
  profile: ProfilePage,
  "profile/email-preferences": EmailPreferencesPage,
  "profile/payment-methods": PaymentMethodsPage,
  "profile/price-alerts": PriceAlertsPage,
  "profile/rewards": RewardsPage,
  "profile/wishlist": WishlistPage,
  register: RegisterPage,
  returns: ReturnsPage,
  shipping: ShippingPage,
  terms: TermsPage,
  checkout: CheckoutPage,
  "checkout/payment-return": PaymentReturnPage,
};

export default async function LocalizedFallbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { segments } = await params;
  const path = segments.join("/");
  if (path === "checkout/success") {
    const query = await searchParams;
    return <CheckoutSuccessPage searchParams={Promise.resolve({ order: typeof query.order === "string" ? query.order : undefined })} />;
  }
  const Page = localizedPages[path];
  if (!Page) notFound();
  return <Page />;
}
