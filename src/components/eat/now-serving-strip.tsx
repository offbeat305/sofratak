import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EAT_METROS } from "@/content/eat-metros";
import { CITIES } from "@/content/cities";
import { getStore } from "@/lib/db/store";
import { CountUp } from "@/components/marketing/count-up";

/**
 * "Now serving" proof band (fix 1, replacing the old thin link-list
 * strip): dark olive with the blueprint grid, real published counts per
 * metro from our own directory, count-up on scroll. Each card links to
 * that /eat metro — it's proof of scale, not just navigation.
 *
 * Metro display order is Zizo's call (Sep 2026): South Florida first.
 * Under the metros, every other city page rides along as an "Also
 * serving" row — the metro cards are the proof, the city row is reach.
 */
const METRO_ORDER = ["miami", "tampa", "dearborn"];

/** City pages whose names already headline a metro card stay out of the row. */
const CITIES_IN_METROS = new Set(["miami", "tampa", "dearborn"]);

export async function NowServingStrip() {
  const t = await getTranslations("site.strip");
  const loc = (await getLocale()) as "en" | "ar";
  const store = getStore();
  const metros = await Promise.all(
    [...EAT_METROS]
      .sort((a, b) => METRO_ORDER.indexOf(a.slug) - METRO_ORDER.indexOf(b.slug))
      .map(async (metro) => ({
        metro,
        count: (await store.listDirectory(metro.slug)).filter((l) => l.published).length,
      })),
  );
  const total = metros.reduce((sum, m) => sum + m.count, 0);
  if (total === 0) return null;

  const moreCities = CITIES.filter((c) => !CITIES_IN_METROS.has(c.slug));

  return (
    <section className="grid-blueprint relative bg-olive">
      <div className="relative mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <p className="data-label text-brass brightness-150">{t("now")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {metros.map(({ metro, count }) => (
            <Link
              key={metro.slug}
              href={`/eat/${metro.slug}`}
              className="glass-pill glow-hover hover-lift flex items-center justify-between gap-3 rounded-card px-5 py-4 text-ivory"
            >
              <span className="font-display text-[15px] font-bold">{metro.name[loc]}</span>
              <span className="data-figure text-lg font-bold text-brass brightness-150" dir="ltr">
                <CountUp value={count} />
              </span>
            </Link>
          ))}
        </div>

        {moreCities.length > 0 && (
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
            <span className="data-label text-ivory/45">{t("more")}</span>
            {moreCities.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="text-sm font-semibold text-ivory/70 underline-offset-4 transition-colors hover:text-ivory hover:underline"
              >
                {city.name[loc]}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
