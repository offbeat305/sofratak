import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { EAT_METROS } from "@/content/eat-metros";
import { EatStatsStrip } from "@/components/eat/eat-stats-strip";
import { SuggestForm } from "@/components/eat/suggest-form";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.eat");
  return {
    title: t("title"),
    description: t("sub"),
    alternates: localeAlternates(locale, "/eat"),
  };
}

export default async function EatLandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("site.eat");

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-stone">{t("sub")}</p>
      <EatStatsStrip className="mt-4" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {EAT_METROS.map((metro) => (
          <Link
            key={metro.slug}
            href={`/eat/${metro.slug}`}
            className="hover-lift card-crisp press rounded-card bg-white p-6"
          >
            <p className="flex items-center gap-2 font-display text-xl font-bold text-olive">
              <MapPin className="size-5 shrink-0 text-brass" aria-hidden />
              {metro.name[loc]}
            </p>
            <p className="mt-2 text-sm text-stone">{metro.blurb[loc]}</p>
            <p className="mt-4 text-sm font-bold text-brass-deep">{t("browseCity")} →</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <SuggestForm />
      </div>

      <p className="mt-6 text-sm text-stone">{t("ownerNote")}</p>
    </div>
  );
}
