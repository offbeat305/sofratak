import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EAT_METROS } from "@/content/eat-metros";
import { getStore } from "@/lib/db/store";
import { CountUp } from "@/components/marketing/count-up";

/**
 * "Now serving" proof band (fix 1, replacing the old thin link-list
 * strip): dark olive with the blueprint grid, real published counts per
 * metro from our own directory, count-up on scroll. Each card links to
 * that /eat metro — it's proof of scale, not just navigation.
 */
export async function NowServingStrip() {
  const t = await getTranslations("site.strip");
  const loc = (await getLocale()) as "en" | "ar";
  const store = getStore();
  const metros = await Promise.all(
    EAT_METROS.map(async (metro) => ({
      metro,
      count: (await store.listDirectory(metro.slug)).filter((l) => l.published).length,
    })),
  );
  const total = metros.reduce((sum, m) => sum + m.count, 0);
  if (total === 0) return null;

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
      </div>
    </section>
  );
}
