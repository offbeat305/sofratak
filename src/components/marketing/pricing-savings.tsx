"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import { Sparkline } from "./tech";

/**
 * Pricing savings slider + tier cards (design-pass-7 §A2/§A3). The
 * slider is the empty-page fix: every tier card recalculates live, so
 * the page does something the moment a prospect lands.
 *
 * Money math is illustrative and says so (branding.md wording). It
 * reads plan prices from lib/billing/plans, the same source Stripe
 * charges from, so marketing can never drift from billing.
 */

const ASSUMED_AVG_TICKET_CENTS = 3000;
const BLENDED_APP_RATE = 0.25;

function money(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}

/** Smoothly settles toward the target, same feel as the hero odometer. */
function useSettle(target: number): number {
  const [value, setValue] = useState(target);
  const raf = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const from = value;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 220, 1);
      setValue(from + (target - from) * p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    const settle = setTimeout(() => setValue(target), 280);
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

export function PricingSavings() {
  const t = useTranslations("site.pricing");
  const [orders, setOrders] = useState(400);
  const tiers = t.raw("tiers") as Array<{ name: string; blurb: string; features: string[] }>;
  const included = t.raw("included") as string[];

  // what the apps would take, minus the flat plan fee
  const appCostCents = orders * ASSUMED_AVG_TICKET_CENTS * BLENDED_APP_RATE;
  const keepBy = PLAN_ORDER.map((tier) =>
    Math.max(0, appCostCents - PLANS[tier].priceCents),
  );
  const settled = [useSettle(keepBy[0]), useSettle(keepBy[1]), useSettle(keepBy[2])];
  const spark = [1, 2, 3, 4, 5, 6].map((i) => (orders / 6) * i);

  return (
    <div>
      {/* the slider */}
      <div className="card-crisp edge-light rounded-card bg-olive p-6 text-ivory sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold sm:text-2xl">{t("sliderTitle")}</h2>
            <p className="mt-1 text-sm text-ivory/70">{t("sliderNote")}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="data-label text-ivory/50">{t("labelOrders")}</span>
            <span className="data-figure text-3xl font-bold text-brass brightness-150" dir="ltr">
              {orders.toLocaleString("en-US")}
            </span>
          </div>
        </div>
        <label className="mt-5 block">
          <span className="sr-only">{t("sliderTitle")}</span>
          <input
            type="range"
            min={50}
            max={2000}
            step={25}
            value={orders}
            onChange={(e) => setOrders(Number(e.target.value))}
            className="sf-slider w-full"
          />
        </label>
        <p className="mt-3 text-xs text-ivory/55">
          {t("sliderAssume", { avg: money(ASSUMED_AVG_TICKET_CENTS) })}
        </p>
      </div>

      {/* tier cards, live-updating */}
      <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-3">
        {tiers.map((tier, i) => {
          const growth = i === 1;
          return (
            <div
              key={tier.name}
              className={cn(
                "hover-lift relative flex h-full flex-col rounded-card p-6 sm:p-8",
                growth
                  ? "edge-light bg-olive text-ivory glow-tier lg:scale-[1.04]"
                  : "glow-hover card-crisp bg-white",
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
                  "data-figure mt-4 text-[44px] leading-none font-extrabold",
                  growth ? "text-brass brightness-150" : "text-brass",
                )}
                dir="ltr"
              >
                {money(PLANS[PLAN_ORDER[i]].priceCents)}
                <span className={cn("text-base font-semibold", growth ? "text-ivory/70" : "text-stone")}>
                  {t("perMonth")}
                </span>
              </p>

              {/* the live savings line */}
              <div
                className={cn(
                  "mt-4 rounded-xl px-3.5 py-3",
                  growth ? "bg-ivory/10" : "bg-olive/[0.06]",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("data-label", growth ? "text-ivory/50" : "text-stone")}>
                    {t("labelKeep")}
                  </span>
                  <Sparkline points={spark} tone={growth ? "ivory" : "brass"} />
                </div>
                <p
                  className={cn(
                    "data-figure mt-1 text-lg font-bold",
                    growth ? "text-ivory" : "text-charcoal",
                  )}
                  dir="ltr"
                >
                  {t("youdKeep", { amount: money(settled[i]) })}
                </p>
              </div>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={cn("flex gap-2 text-[15px]", growth ? "text-ivory/90" : "text-charcoal")}
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
                  "press btn-shine mt-7 inline-flex h-12 items-center justify-center rounded-btn font-bold",
                  growth ? "bg-brass text-olive" : "border-[1.5px] border-olive text-olive hover:bg-olive/5",
                )}
              >
                {t("cta")}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm font-semibold text-stone">{t("monthToMonth")}</p>

      {/* what's included in every tier */}
      <div className="card-crisp mt-8 rounded-card bg-white p-6 sm:p-8">
        <p className="data-label text-stone">{t("includedTitle")}</p>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[15px] text-charcoal">
              <Check className="mt-0.5 size-4.5 shrink-0 text-brass" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
