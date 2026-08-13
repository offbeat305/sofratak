import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { CountUp } from "./count-up";
import { Reveal } from "./reveal";

const PRICES = [249, 349, 499]; // business constants — see CLAUDE.md

/** Pricing cards with the Growth tier elevated (design-pass §7). */
export async function TierCards() {
  const t = await getTranslations("site.pricing");
  const tiers = t.raw("tiers") as Array<{
    name: string;
    blurb: string;
    features: string[];
  }>;

  return (
    <div>
      <div className="grid items-stretch gap-5 lg:grid-cols-3">
        {tiers.map((tier, i) => {
          const growth = i === 1;
          return (
            <Reveal key={tier.name} delay={i * 80}>
              <div
                className={cn(
                  "hover-lift relative flex h-full flex-col rounded-card p-6 sm:p-8",
                  growth
                    ? "bg-olive text-ivory shadow-[0_24px_60px_rgba(31,50,40,0.35)] lg:scale-[1.06]"
                    : "border border-olive/10 bg-white shadow-[0_1px_3px_rgba(31,31,31,0.05)]",
                )}
              >
                {growth && (
                  <span className="absolute -top-3 start-6 rounded-full bg-brass px-3 py-1 text-xs font-extrabold tracking-wide text-olive uppercase">
                    {t("popular")}
                  </span>
                )}
                <h3 className={cn("text-lg font-bold", growth ? "text-sand" : "text-olive")}>
                  {tier.name}
                </h3>
                <p className={cn("mt-1 text-sm", growth ? "text-ivory/75" : "text-stone")}>
                  {tier.blurb}
                </p>
                <p
                  className={cn(
                    "mt-4 text-[44px] leading-none font-extrabold tabular-nums",
                    growth ? "text-brass brightness-150" : "text-brass",
                  )}
                  dir="ltr"
                >
                  <CountUp value={PRICES[i]} prefix="$" />
                  <span
                    className={cn(
                      "text-base font-semibold",
                      growth ? "text-ivory/70" : "text-stone",
                    )}
                  >
                    {t("perMonth")}
                  </span>
                </p>
                <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className={cn(
                        "flex gap-2 text-[15px]",
                        growth ? "text-ivory/90" : "text-charcoal",
                      )}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          growth ? "text-brass brightness-150" : "text-positive",
                        )}
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/demo"
                  className={cn(
                    "btn-shine mt-7 inline-flex h-12 items-center justify-center rounded-btn font-bold transition-transform duration-150 hover:scale-[1.02] motion-reduce:hover:scale-100",
                    growth
                      ? "bg-brass text-olive"
                      : "border-[1.5px] border-olive text-olive hover:bg-olive/5",
                  )}
                >
                  {t("cta")}
                </Link>
              </div>
            </Reveal>
          );
        })}
      </div>
      <p className="mt-9 text-center text-sm font-semibold text-stone">{t("honest")}</p>
    </div>
  );
}
