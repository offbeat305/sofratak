import { getLocale, getTranslations } from "next-intl/server";
import { EAT_METROS } from "@/content/eat-metros";
import { getStore } from "@/lib/db/store";
import { CountUp } from "@/components/marketing/count-up";

/**
 * Live directory stats strip (design-pass-2 B): real counts from the
 * DB with the count-up treatment — grows as the directory grows.
 * Server component; freshness rides the parent page's revalidate.
 */
export async function EatStatsStrip({ className = "" }: { className?: string }) {
  const t = await getTranslations("site.eat");
  const locale = (await getLocale()) as "en" | "ar";
  const store = getStore();
  const counts = await Promise.all(
    EAT_METROS.map(async (m) => (await store.listDirectory(m.slug)).filter((l) => l.published).length),
  );
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const metroNames = EAT_METROS.map((m) => m.name[locale]).join(locale === "ar" ? "، " : ", ");

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-stone ${className}`}>
      <span className="text-charcoal">
        <CountUp value={total} className="font-bold text-brass" /> {t("statsRestaurants")}
      </span>
      <span aria-hidden>·</span>
      <span>{t("statsStates", { count: 3 })}</span>
      <span aria-hidden>·</span>
      <span>{metroNames}</span>
    </p>
  );
}
