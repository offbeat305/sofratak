"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared design-pass-7 §D primitives. Kept in one file so every
 * marketing page reaches for the same pieces instead of re-inventing
 * them (the lesson from the glow system in pass 3).
 */

/**
 * §D5 Cursor-follow glow. Writes pointer position into CSS vars that
 * `.cursor-glow` reads. Only `pointermove` from a real mouse arms it, so
 * touch devices never trigger it and reduced-motion hides it in CSS.
 */
export function CursorGlow({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    };
    const onLeave = () => el.style.setProperty("--mx", "-999px");

    el.classList.add("cursor-glow");
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.classList.remove("cursor-glow");
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} aria-hidden className={cn("hidden", className)} />;
}

/**
 * §D3 Sparkline: a tiny inline trend next to a quoted number. Pure SVG,
 * no animation, decorative only (the number carries the meaning).
 */
export function Sparkline({
  points,
  className,
  tone = "brass",
}: {
  points: number[];
  className?: string;
  tone?: "brass" | "ivory";
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 24 - ((p - min) / span) * 22;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-5 w-16", className)}
    >
      <path
        d={d}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={tone === "brass" ? "stroke-brass" : "stroke-ivory/60"}
      />
    </svg>
  );
}

/** §D1 mono stat: uppercase mono label over a figure. */
export function DataStat({
  label,
  value,
  tone = "dark",
  spark,
  className,
}: {
  label: string;
  value: string;
  /** dark = on olive, light = on ivory */
  tone?: "dark" | "light";
  spark?: number[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className={cn("data-label", tone === "dark" ? "text-ivory/50" : "text-stone")}>
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "data-figure text-xl font-bold",
            tone === "dark" ? "text-brass brightness-150" : "text-brass-deep",
          )}
          dir="ltr"
        >
          {value}
        </span>
        {spark && <Sparkline points={spark} tone={tone === "dark" ? "ivory" : "brass"} />}
      </span>
    </div>
  );
}
