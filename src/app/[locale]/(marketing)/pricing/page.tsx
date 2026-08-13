import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const PRICES = ["$249", "$349", "$499"]; // business constants — see CLAUDE.md

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
  const tiers = t.raw("tiers") as Array<{
    name: string;
    blurb: string;
    features: string[];
  }>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-center font-display text-3xl font-bold text-olive sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-stone">{t("sub")}</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {tiers.map((tier, i) => {
          const popular = i === 1;
          return (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col rounded-card border bg-white p-6 shadow-[0_1px_3px_rgba(31,31,31,0.05)] sm:p-8",
                popular ? "border-brass ring-2 ring-brass/25" : "border-olive/10",
              )}
            >
              {popular && (
                <span className="mb-3 self-start rounded-full bg-brass/12 px-3 py-1 text-xs font-bold text-brass-deep">
                  {t("popular")}
                </span>
              )}
              <h2 className="text-lg font-bold text-olive">{tier.name}</h2>
              <p className="mt-1 text-sm text-stone">{tier.blurb}</p>
              <p className="mt-4 text-4xl font-bold text-brass tabular-nums" dir="ltr">
                {PRICES[i]}
                <span className="text-base font-semibold text-stone">{t("perMonth")}</span>
              </p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-[15px] text-charcoal">
                    <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/demo"
                className={buttonClasses({
                  variant: popular ? "primary" : "secondary",
                  className: "mt-6",
                })}
              >
                {t("cta")}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-stone">
        {t("footnote")}
      </p>
    </div>
  );
}
