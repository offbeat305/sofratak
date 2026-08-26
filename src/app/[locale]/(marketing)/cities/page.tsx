import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES } from "@/content/cities";
import { CitiesMap } from "@/components/marketing/cities-map";
import { CityRequestForm } from "@/components/marketing/city-request-form";
import { EatStatsStrip } from "@/components/eat/eat-stats-strip";
import { Reveal } from "@/components/marketing/reveal";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.citiesPage");
  return {
    title: t("indexTitle"),
    description: t("indexSub"),
    alternates: localeAlternates(locale, "/cities"),
  };
}

export default async function CitiesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("site.citiesPage");

  return (
    <div className="pt-16">
      <section className="hero-ambient grid-blueprint relative bg-olive text-ivory">
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl">
            {t("indexTitle")}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-ivory/80">{t("indexSub")}</p>
          <div className="mt-5">
            <EatStatsStrip className="text-ivory/70" />
          </div>
        </div>
      </section>

      <section className="bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight font-bold text-olive sm:text-4xl">
              {t("mapTitle")}
            </h2>
            <p className="mt-1 text-stone">{t("mapSub")}</p>
          </Reveal>
          <div className="mt-8">
            <CitiesMap />
          </div>
        </div>
      </section>

      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight font-bold text-olive sm:text-4xl">
              {t("otherCities")}
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CITIES.map((city, i) => (
              <Reveal key={city.slug} delay={(i % 6) * 60}>
                <li>
                  <Link
                    href={`/cities/${city.slug}`}
                    className="hover-lift flex items-baseline justify-between gap-2 rounded-card border border-olive/10 bg-white p-4 font-bold text-olive"
                  >
                    {city.name[loc]}
                    <span className="text-xs font-semibold text-stone">{city.state}</span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* "not in your city yet?" capture (design-pass-7 §B) */}
      <section className="grid-blueprint relative bg-olive-deep">
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <CityRequestForm />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
