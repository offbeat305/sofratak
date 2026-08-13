"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

function useCountUp(target: number, animate: boolean, durationMs = 900) {
  // Non-animated cards render the real value immediately (and in server HTML).
  const [value, setValue] = useState(animate ? 0 : target);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      if (started.current) return;
      started.current = true;
      if (reduced) {
        setValue(target);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / durationMs, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // rAF pauses in hidden/backgrounded tabs — this guarantees the final
      // value lands no matter what (the bug behind frozen dashboard tiles).
      timeout = setTimeout(() => setValue(target), durationMs + 200);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [target, durationMs, animate]);

  return { ref, value: animate ? value : target };
}

type StatCardProps = {
  label: string;
  value: number;
  /** "currency" formats as USD with no decimals; "number" plain; "percent" appends % */
  format?: "currency" | "number" | "percent";
  /** signed percentage, e.g. 12 or -4 */
  delta?: number;
  deltaLabel?: string;
  /** count-up is marketing polish; dashboards want instant numbers */
  animate?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  format = "number",
  delta,
  deltaLabel,
  animate = true,
  className,
}: StatCardProps) {
  const locale = useLocale();
  const { ref, value: animated } = useCountUp(value, animate);
  // Latin digits everywhere: matches the brand's money style in Arabic UI and
  // keeps server (Node ICU) and client (browser ICU) output identical.
  const numberLocale = locale === "ar" ? "ar-u-nu-latn" : locale;

  const formatted =
    format === "currency"
      ? // money always displays "$1,234" style (business decision, Aug 2026);
        // cents show only when the target value has them
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
          maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
        }).format(Math.round(animated * 100) / 100)
      : format === "percent"
        ? new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(
            Math.round(animated),
          ) + "%"
        : new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(
            Math.round(animated),
          );

  const positive = (delta ?? 0) >= 0;

  return (
    <Card className={cn("p-6", className)}>
      <div ref={ref} className="flex flex-col gap-2">
        <span className="text-sm font-medium text-stone">{label}</span>
        <span
          className="text-3xl font-bold tracking-tight text-brass tabular-nums sm:text-4xl"
          dir="ltr"
          suppressHydrationWarning
        >
          {formatted}
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-semibold",
              positive ? "text-positive" : "text-error",
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-4" aria-hidden />
            ) : (
              <ArrowDownRight className="size-4" aria-hidden />
            )}
            <span dir="ltr">
              {positive ? "+" : ""}
              {delta}%
            </span>
            {deltaLabel && (
              <span className="font-normal text-stone">{deltaLabel}</span>
            )}
          </span>
        )}
      </div>
    </Card>
  );
}
