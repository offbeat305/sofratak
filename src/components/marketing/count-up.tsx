"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Money/number count-up on viewport entry (design-pass §6: 800ms, once).
 * Always lands exactly on the target — completion timer guards against
 * paused animation frames (the dashboard-tiles lesson).
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  className,
  durationMs = 800,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Rest at the true value (server HTML, no-JS, screenshots); the count-up
  // from 0 begins only at the moment the number first becomes visible.
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const start = () => {
      if (started.current) return;
      started.current = true;
      if (reduced) {
        setShown(value);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / durationMs, 1);
        setShown(value * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      timeout = setTimeout(() => setShown(value), durationMs + 200);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)} dir="ltr">
      {prefix}
      {Math.round(shown).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
