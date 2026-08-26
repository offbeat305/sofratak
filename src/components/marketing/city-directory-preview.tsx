import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMetro } from "@/content/eat-metros";
import { composeMetroListings } from "@/lib/eat/compose";
import { ListingPlaceholder } from "@/components/eat/listing-placeholder";
import { DataStat } from "./tech";

/**
 * Live directory preview on a city page (design-pass-7 §B). Turns a thin
 * SEO page into a genuinely useful one: real counts and six real
 * listings straight from our own DB, which is also what Google rewards.
 *
 * Marketing cities are city-level; the directory is organised by metro,
 * so CITY_TO_METRO maps between them and we prefer listings whose
 * address actually names this city before falling back to the metro.
 */
const CITY_TO_METRO: Record<string, string> = {
  tampa: "tampa",
  "st-petersburg": "tampa",
  miami: "miami",
  "fort-lauderdale": "miami",
  "hollywood-fl": "miami",
  "west-palm-beach": "miami",
  dearborn: "dearborn",
  "dearborn-heights": "dearborn",
  detroit: "dearborn",
  hamtramck: "dearborn",
  // orlando and jacksonville have no directory metro yet, so the whole
  // block renders nothing rather than showing another city's restaurants
};

export async function CityDirectoryPreview({
  citySlug,
  cityName,
}: {
  citySlug: string;
  cityName: string;
}) {
  const metroSlug = CITY_TO_METRO[citySlug];
  const metro = metroSlug ? getMetro(metroSlug) : undefined;
  if (!metro) return null;

  const all = await composeMetroListings(metro);
  if (all.length === 0) return null;

  const t = await getTranslations("site.citiesPage");
  const loc = (await getLocale()) as "en" | "ar";

  // prefer listings that actually sit in this city
  const needle = cityName.toLowerCase();
  const local = all.filter((l) => l.address.toLowerCase().includes(needle));
  const picks = (local.length >= 6 ? local : [...local, ...all.filter((l) => !local.includes(l))])
    .slice(0, 6);
  const count = local.length >= 6 ? local.length : all.length;

  return (
    <section className="texture-dots bg-ivory">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
              {t("directoryTitle", { city: cityName })}
            </h2>
            <p className="mt-1 text-stone">{t("directorySub")}</p>
          </div>
          <DataStat
            tone="light"
            label={t("directoryStatLabel")}
            value={String(count)}
            spark={[3, 5, 4, 8, 11, 14]}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((listing) => (
            <Link
              key={listing.id}
              href={`/eat/${metro.slug}/${listing.slug}`}
              className="card-crisp hover-lift glow-hover flex gap-3.5 rounded-card bg-white p-4"
            >
              <ListingPlaceholder
                name={listing.name}
                className="size-16 shrink-0 overflow-hidden rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-charcoal">{listing.name}</p>
                <p className="mt-0.5 truncate text-xs text-stone">{listing.address}</p>
                <p className="mt-1 truncate text-xs text-stone">
                  {listing.cuisines.slice(0, 2).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href={`/eat/${metro.slug}`}
          className="mt-6 inline-block text-sm font-bold text-brass-deep underline-offset-4 hover:underline"
        >
          {t("directoryAll", { count, metro: metro.name[loc] })} →
        </Link>
      </div>
    </section>
  );
}
