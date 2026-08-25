"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * "Where your $30 order goes" (design-pass §4). Scroll-triggered, plays
 * once, replay on click. Pure CSS transitions driven by a phase counter —
 * transform/opacity only, so it stays at 60fps on a phone.
 * Timeline: fill 0–600ms · break 600–1200ms · settle by 1600ms.
 */
export function DollarComparison() {
  const t = useTranslations("site.dollar");
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "fill" | "break" | "done">("idle");
  const played = useRef(false);
  const [appsKeep, setAppsKeep] = useState(0);

  const play = () => {
    setPhase("fill");
    setAppsKeep(0);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("done");
      setAppsKeep(2250);
      return;
    }
    setTimeout(() => setPhase("break"), 600);
    // count $30.00 → $22.50 while the chunk slides away
    const t0 = performance.now();
    const count = (now: number) => {
      const p = Math.min(Math.max((now - t0 - 600) / 600, 0), 1);
      setAppsKeep(3000 - 750 * p);
      if (p < 1) requestAnimationFrame(count);
      else setPhase("done");
    };
    requestAnimationFrame(count);
    setTimeout(() => {
      setPhase("done");
      setAppsKeep(2250);
    }, 1800);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !played.current) {
          played.current = true;
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filling = phase !== "idle";
  const breaking = phase === "break" || phase === "done";
  const fmt = (cents: number) =>
    "$" + (cents / 100).toFixed(2);

  return (
    <div ref={ref} className="flex flex-col gap-10">
      {/* Row A — the apps */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-bold text-charcoal">{t("rowApps")}</p>
          <p
            className={cn(
              "text-xl font-extrabold text-charcoal tabular-nums",
              phase === "done" && "glow-land-now",
            )}
            dir="ltr"
          >
            {phase === "idle" ? "—" : t("keeps", { amount: fmt(appsKeep) })}
          </p>
        </div>
        <div className="relative mt-3 h-12" dir="ltr">
          {/* keeps portion (75%) */}
          <div
            className={cn(
              "absolute inset-y-0 start-0 rounded-s-xl bg-olive transition-[width] duration-[600ms] ease-out",
              filling ? "w-3/4" : "w-0",
            )}
          />
          {/* the 25% that breaks off and slides away */}
          <div
            className={cn(
              "absolute inset-y-0 start-3/4 w-1/4 rounded-e-xl bg-[#C0392B] transition-all duration-[900ms] ease-out",
              !filling && "opacity-0",
              filling && !breaking && "opacity-100",
              breaking && "translate-x-[140%] rotate-3 opacity-0",
            )}
          />
        </div>
        <p className="mt-2 text-sm text-stone">{t("appsCaption")}</p>
      </div>

      {/* Row B — Sofratak */}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-bold text-charcoal">{t("rowSofratak")}</p>
          <p
            className={cn(
              "text-xl font-extrabold text-positive tabular-nums",
              phase === "done" && "glow-land-now",
            )}
            dir="ltr"
          >
            {phase === "idle" ? "—" : t("keeps", { amount: "$30.00" })}
          </p>
        </div>
        <div className="relative mt-3 h-12" dir="ltr">
          <div
            className={cn(
              "absolute inset-y-0 start-0 rounded-xl bg-olive transition-[width] duration-[600ms] ease-out",
              filling ? "w-full" : "w-0",
            )}
          />
          {/* the 79¢ sliver — diner-paid, detaches slightly */}
          <div
            className={cn(
              "absolute inset-y-1 w-2 rounded-full bg-brass brightness-125 transition-all delay-700 duration-500",
              breaking ? "end-[-18px] opacity-100" : "end-2 opacity-0",
            )}
            aria-hidden
          />
        </div>
        <p className="mt-2 text-sm text-stone">79¢ — {t("sofratakCaption")}</p>
      </div>

      <button
        type="button"
        onClick={play}
        className="inline-flex items-center gap-2 self-center rounded-btn px-4 py-2 text-sm font-bold text-olive hover:bg-olive/5"
      >
        <RotateCcw className="size-4" aria-hidden />
        {t("replay")}
      </button>
    </div>
  );
}
