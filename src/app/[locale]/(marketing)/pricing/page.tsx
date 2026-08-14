import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TierCards } from "@/components/marketing/tier-cards";
import { FOUNDER_STORY } from "@/content/founder-story";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.pricing");
  return {
    title: t("title"),
    description: t("sub"),
    alternates: localeAlternates(locale, "/pricing"),
  };
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
      <h1 className="font-display text-4xl leading-tight font-bold text-olive sm:text-[44px]">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-xl text-lg text-stone">{t("sub")}</p>
      {locale === "en" && (
        // founder-story credibility badge (EN until AR review)
        <Link
          href="/about"
          className="mt-4 inline-block rounded-full border border-olive/25 px-4 py-1.5 text-xs font-bold text-olive transition-colors hover:border-olive/60"
        >
          {FOUNDER_STORY.reuse.badge}
        </Link>
      )}
      <div className="mt-12">
        <TierCards />
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-stone">
        {t("footnote")}
      </p>
    </div>
  );
}
