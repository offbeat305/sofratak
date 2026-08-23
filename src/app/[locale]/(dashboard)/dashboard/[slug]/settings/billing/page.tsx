import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { syncBillingStatus } from "@/lib/billing/stripe";
import { BillingCard } from "@/components/dashboard/billing-card";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dash");

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  // Returning from Stripe checkout/portal lands here — pick up the latest
  // status without waiting on webhook delivery (mirrors the Connect flow).
  const synced = await syncBillingStatus(restaurant);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("billingTitle")}</h1>
      <div className="max-w-xl">
        <BillingCard slug={slug} billing={synced.billing} />
      </div>
    </div>
  );
}
