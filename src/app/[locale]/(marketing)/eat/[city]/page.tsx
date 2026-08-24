import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EAT_METROS, getMetro } from "@/content/eat-metros";
import { composeMetroListings } from "@/lib/eat/compose";
import { CityView } from "@/components/eat/city-view";
import { SuggestForm } from "@/components/eat/suggest-form";
import { localeAlternates } from "@/lib/seo";

// Listings change rarely, but "Open now" shouldn't go too stale.
export const revalidate = 300;

export function generateStaticParams() {
  return EAT_METROS.map((m) => ({ city: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}): Promise<Metadata> {
  const { locale, city } = await params;
  const metro = getMetro(city);
  if (!metro) return {};
  const t = await getTranslations("site.eat");
  const loc = locale as "en" | "ar";
  return {
    title: t("cityTitle", { city: metro.name[loc] }),
    description: metro.blurb[loc],
    alternates: localeAlternates(locale, `/eat/${city}`),
  };
}

export default async function EatCityPage({
  params,
}: {
  params: Promise<{ locale: string; city: string }>;
}) {
  const { locale, city } = await params;
  const metro = getMetro(city);
  if (!metro) notFound();
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("site.eat");

  const listings = await composeMetroListings(metro);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-24 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("cityTitle", { city: metro.name[loc] })}
      </h1>
      <p className="mt-1 text-stone">
        {t("cityCount", { count: listings.length })}
      </p>
      <div className="mt-6">
        <CityView city={city} listings={listings} center={metro.center} zoom={metro.zoom} />
      </div>
      <div className="mt-8">
        <SuggestForm defaultCity={city} />
      </div>
      {/* ODbL attribution: some listing data comes from OpenStreetMap */}
      <p className="mt-4 text-xs text-stone">
        {t("osmAttribution")}{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-olive"
        >
          © OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
