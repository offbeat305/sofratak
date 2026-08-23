import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getStore } from "@/lib/db/store";
import { syncConnectStatus } from "@/lib/payments/connect";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { PayoutsCard } from "@/components/dashboard/payouts-card";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dash");

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  // Returning from Stripe onboarding lands here — pick up the new status.
  const chargesEnabled = restaurant.stripe.accountId
    ? await syncConnectStatus(restaurant)
    : false;
  const payoutStatus = chargesEnabled
    ? ("active" as const)
    : restaurant.stripe.accountId
      ? ("incomplete" as const)
      : ("none" as const);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("settings")}</h1>
      <div className="max-w-xl">
        <PayoutsCard slug={slug} status={payoutStatus} />
      </div>
      <Link
        href={`/dashboard/${slug}/settings/billing`}
        className="flex max-w-xl items-center gap-2 rounded-card border border-olive/10 bg-white p-5 font-bold text-olive transition-colors hover:bg-olive/5"
      >
        <CreditCard className="size-4" aria-hidden />
        {t("billingTitle")}
      </Link>
      <SettingsForm slug={slug} restaurant={restaurant} />
    </div>
  );
}
