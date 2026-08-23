import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { CampaignsCard } from "@/components/dashboard/marketing/campaigns-card";
import { OfferCodesCard } from "@/components/dashboard/marketing/offer-codes-card";
import { LoyaltyCard } from "@/components/dashboard/marketing/loyalty-card";
import { AutomationsCard } from "@/components/dashboard/marketing/automations-card";

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dash");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const [campaigns, offerCodes] = await Promise.all([
    store.listCampaigns(restaurant.id),
    store.listOfferCodes(restaurant.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-olive">{t("marketing")}</h1>
      <div className="grid max-w-3xl gap-4">
        <CampaignsCard slug={slug} campaigns={campaigns} />
        <OfferCodesCard slug={slug} offerCodes={offerCodes} />
        <LoyaltyCard slug={slug} settings={restaurant.loyaltySettings} />
        <AutomationsCard
          slug={slug}
          settings={restaurant.automations}
          hasReviewsUrl={Boolean(restaurant.googleReviewsUrl)}
          offerCodes={offerCodes.filter((c) => c.active).map((c) => c.code)}
        />
      </div>
    </div>
  );
}
