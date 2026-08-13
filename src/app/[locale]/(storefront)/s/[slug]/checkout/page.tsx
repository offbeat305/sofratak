import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { CheckoutView } from "@/components/storefront/checkout-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("storefront");
  return { title: t("checkout"), robots: { index: false } };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { locale, slug } = await params;
  const { canceled } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("storefront");

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return (
    <div className="pt-6">
      <h1 className="pb-4 text-2xl font-bold text-charcoal">{t("checkout")}</h1>
      <CheckoutView restaurant={restaurant} paymentCanceled={canceled === "1"} />
    </div>
  );
}
