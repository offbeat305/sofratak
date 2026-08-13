import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TierCards } from "@/components/marketing/tier-cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.pricing");
  return { title: t("title"), description: t("sub") };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.pricing");

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-4xl leading-tight font-semibold text-olive sm:text-[44px]">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-xl text-lg text-stone">{t("sub")}</p>
      <div className="mt-12">
        <TierCards />
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-stone">
        {t("footnote")}
      </p>
    </div>
  );
}
