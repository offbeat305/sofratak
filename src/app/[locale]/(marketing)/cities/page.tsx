import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES } from "@/content/cities";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("site.citiesPage");
  return { title: t("indexTitle"), description: t("indexSub") };
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
    <div className="mx-auto max-w-4xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("indexTitle")}
      </h1>
      <p className="mt-2 text-stone">{t("indexSub")}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((city) => (
          <li key={city.slug}>
            <Link
              href={`/cities/${city.slug}`}
              className="flex items-baseline justify-between gap-2 rounded-card border border-olive/10 bg-white p-4 font-bold text-olive transition-colors hover:border-olive/40"
            >
              {city.name[loc]}
              <span className="text-xs font-semibold text-stone">{city.state}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
