"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatCents } from "@/lib/money";
import { cn } from "@/lib/cn";
import { submitLeadAction } from "@/app/[locale]/(marketing)/actions";

const GROWTH_MONTHLY = 349; // pricing anchor per the website spec

/** Smoothly settles toward the target — never sticks on a stale value. */
function useSettle(target: number): number {
  const [value, setValue] = useState(target);
  const raf = useRef(0);
  useEffect(() => {
    const t0 = performance.now();
    const from = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || from === target) {
      setValue(target);
      return;
    }
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 250, 1);
      setValue(from + (target - from) * (1 - Math.pow(1 - p, 2)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    const settle = setTimeout(() => setValue(target), 300);
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

export function Estimator() {
  const t = useTranslations("site.estimator");
  const tSite = useTranslations("site");
  const locale = useLocale() as "en" | "ar";

  const [orders, setOrders] = useState(500);
  const [avg, setAvg] = useState(30);
  const [rate, setRate] = useState(25);

  const monthlyCents = Math.round(orders * avg * (rate / 100) * 100);
  const yearlyCents = monthlyCents * 12;
  const diffCents = Math.max(0, yearlyCents - GROWTH_MONTHLY * 12 * 100);

  const monthly = useSettle(monthlyCents);
  const yearly = useSettle(yearlyCents);
  const diff = useSettle(diffCents);

  // soft capture (after the number, never gating)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await submitLeadAction({
      kind: "estimate",
      name,
      phone,
      website,
      locale,
      data: {
        ordersPerMonth: orders,
        averageOrderUsd: avg,
        blendedRatePct: rate,
        estimatedMonthlyUsd: Math.round(monthlyCents / 100),
        estimatedYearlyUsd: Math.round(yearlyCents / 100),
        estimatedDifferenceUsd: Math.round(diffCents / 100),
      },
    });
    setState(result.ok ? "sent" : "error");
  };

  const money = (cents: number) => formatCents(Math.round(cents / 100) * 100, locale).replace(/\.00$/, "");
  const sliderCls =
    "w-full accent-brass h-2 cursor-pointer";
  const rowCls = "flex flex-col gap-1.5";
  const labelCls = "flex items-baseline justify-between text-sm font-bold text-olive";
  const valueCls = "text-base font-bold text-charcoal tabular-nums";

  return (
    <div className="flex flex-col gap-6">
      {/* inputs */}
      <div className="flex flex-col gap-5 rounded-card border border-olive/10 bg-white p-5 sm:p-6">
        <div className={rowCls}>
          <label htmlFor="est-orders" className={labelCls}>
            {t("orders")}
            <span className={valueCls} dir="ltr">{orders.toLocaleString("en-US")}</span>
          </label>
          <input
            id="est-orders"
            type="range"
            min={50}
            max={3000}
            step={25}
            value={orders}
            onChange={(e) => setOrders(Number(e.target.value))}
            className={sliderCls}
          />
        </div>
        <div className={rowCls}>
          <label htmlFor="est-avg" className={labelCls}>
            {t("avg")}
            <span className={valueCls} dir="ltr">${avg}</span>
          </label>
          <input
            id="est-avg"
            type="range"
            min={10}
            max={100}
            step={1}
            value={avg}
            onChange={(e) => setAvg(Number(e.target.value))}
            className={sliderCls}
          />
        </div>
        <div className={rowCls}>
          <label htmlFor="est-rate" className={labelCls}>
            {t("rate")}
            <span className={valueCls} dir="ltr">{rate}%</span>
          </label>
          <input
            id="est-rate"
            type="range"
            min={15}
            max={30}
            step={1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className={sliderCls}
          />
        </div>
      </div>

      {/* results */}
      <div className="rounded-card bg-olive p-6 text-ivory sm:p-8" aria-live="polite">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-ivory/70">{t("monthly")}</p>
            <p className="mt-1 text-4xl font-bold text-sand tabular-nums sm:text-5xl" dir="ltr">
              {money(monthly)}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ivory/70">{t("yearly")}</p>
            <p className="mt-1 text-4xl font-bold text-sand tabular-nums sm:text-5xl" dir="ltr">
              {money(yearly)}
            </p>
          </div>
        </div>
        <div className="mt-6 border-t border-ivory/15 pt-5">
          <p className="text-[15px] font-semibold">
            {t("sofratak", { price: `$${GROWTH_MONTHLY}` })}
          </p>
          <p className="mt-2 text-sm font-semibold text-ivory/70">{t("difference")}</p>
          <p className="mt-1 text-4xl font-bold text-brass tabular-nums brightness-125 sm:text-5xl" dir="ltr">
            {money(diff)}
          </p>
        </div>
        <p className="mt-5 text-xs text-ivory/60">{tSite("disclaimer")}</p>
      </div>

      {/* soft capture — after the number, optional */}
      <div className="rounded-card border border-olive/10 bg-white p-5 sm:p-6">
        {state === "sent" ? (
          <p className="font-semibold text-positive" role="status">
            {t("sent")}
          </p>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
              name="website"
            />
            <label className="flex-1">
              <span className="text-sm font-bold text-olive">{t("name")}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
            </label>
            <label className="flex-1">
              <span className="text-sm font-bold text-olive">{t("phone")}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                dir="ltr"
                required
                className="mt-1 h-11 w-full rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
            </label>
            <button
              type="submit"
              disabled={state === "sending"}
              className={cn(
                "h-11 shrink-0 rounded-btn bg-brass px-6 font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50",
              )}
            >
              {state === "sending" ? t("sending") : t("textMe")}
            </button>
          </form>
        )}
        {state === "error" && (
          <p className="mt-2 text-sm font-semibold text-error" role="alert">
            {t("error")}
          </p>
        )}
      </div>
    </div>
  );
}
