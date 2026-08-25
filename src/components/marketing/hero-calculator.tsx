"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { submitLeadAction } from "@/app/[locale]/(marketing)/actions";

const GROWTH_MONTHLY = 349;

function useSettle(target: number, durationMs = 120): number {
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
      const p = Math.min((now - t0) / durationMs, 1);
      setValue(from + (target - from) * p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    const settle = setTimeout(() => setValue(target), durationMs + 80);
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(settle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);
  return value;
}

function money(cents: number): string {
  return "$" + Math.round(cents / 100).toLocaleString("en-US");
}

function Slider({
  id,
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-olive">
        {label}
      </label>
      <div className="relative mt-6">
        {/* value bubble above the thumb */}
        <span
          className="pointer-events-none absolute -top-6 -translate-x-1/2 rounded-full bg-brass px-2 py-0.5 text-xs font-bold text-ivory tabular-nums rtl:translate-x-1/2"
          style={{ insetInlineStart: `calc(${percent}% + ${(11 - percent * 0.22)}px)` }}
          dir="ltr"
          aria-hidden
        >
          {display}
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="sf-slider w-full"
          aria-valuetext={display}
        />
      </div>
    </div>
  );
}

/** The hero IS the calculator (design-pass §2). */
export function HeroCalculator() {
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

  // capture (ghost link opens it)
  const [captureOpen, setCaptureOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // subtle 3D tilt (max 2deg), mouse only, reduced-motion off
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 2}deg) rotateX(${-y * 2}deg)`;
    };
    const onLeave = () => {
      card.style.transform = "";
    };
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

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

  return (
    <div
      ref={cardRef}
      className="rounded-[20px] bg-ivory p-6 shadow-[0_22px_54px_rgba(24,38,31,0.42)] transition-transform duration-150 will-change-transform sm:p-8"
    >
      <h2 className="font-display text-[26px] leading-snug font-bold text-olive">
        {t("title")}
      </h2>

      <div className="mt-7 flex flex-col gap-7">
        <Slider
          id="hero-orders"
          label={t("orders")}
          min={50}
          max={3000}
          step={25}
          value={orders}
          display={orders.toLocaleString("en-US")}
          onChange={setOrders}
        />
        <Slider
          id="hero-avg"
          label={t("avg")}
          min={10}
          max={100}
          step={1}
          value={avg}
          display={`$${avg}`}
          onChange={setAvg}
        />
        <Slider
          id="hero-rate"
          label={t("rate")}
          min={15}
          max={30}
          step={1}
          value={rate}
          display={`${rate}%`}
          onChange={setRate}
        />
      </div>

      {/* result zone */}
      <div className="mt-7 rounded-2xl bg-olive p-5 text-ivory" aria-live="polite">
        <p className="text-[15px] leading-relaxed font-semibold">
          {t.rich("resultLine", {
            monthly: money(monthly),
            yearly: money(yearly),
            m: (chunks) => (
              <span
                className="text-[28px] font-extrabold text-brass brightness-150 tabular-nums sm:text-[34px]"
                dir="ltr"
              >
                {chunks}
              </span>
            ),
          })}
        </p>
        <p className="mt-3 border-t border-ivory/15 pt-3 text-sm text-ivory/85">
          {t("growthLine", {
            price: `$${GROWTH_MONTHLY}`,
            diff: money(diff),
          })}
        </p>
        <p className="mt-2 text-[11px] leading-snug text-ivory/55">{tSite("disclaimer")}</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Link
          href="/demo"
          className="btn-shine inline-flex h-12 items-center rounded-btn bg-brass px-6 font-bold text-olive transition-transform duration-150 hover:scale-[1.03] motion-reduce:hover:scale-100"
        >
          {t("bookDemo")}
        </Link>
        {state === "sent" ? (
          <p className="text-sm font-semibold text-positive" role="status">
            {t("sent")}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setCaptureOpen(!captureOpen)}
            className="text-sm font-bold text-olive underline-offset-4 hover:underline"
          >
            {t("textMe")}
          </button>
        )}
      </div>

      {captureOpen && state !== "sent" && (
        <form onSubmit={send} className="animate-rise-in mt-4 flex flex-col gap-2 sm:flex-row">
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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            required
            aria-label={t("name")}
            className="h-11 flex-1 rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phone")}
            type="tel"
            inputMode="tel"
            dir="ltr"
            required
            aria-label={t("phone")}
            className="h-11 flex-1 rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="h-11 rounded-btn bg-olive px-5 text-sm font-bold text-ivory disabled:opacity-50"
          >
            {state === "sending" ? t("sending") : t("send")}
          </button>
        </form>
      )}
      {state === "error" && (
        <p className="mt-2 text-sm font-semibold text-error" role="alert">
          {t("error")}
        </p>
      )}
    </div>
  );
}
