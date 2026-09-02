"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * "Where your $30 order goes" (design-pass §4, reworked per Zizo Sep 2026:
 * the old version's red chunk flew off-screen in ~1s and vanished, which
 * read as a glitch, not a story). Now: slower timeline, and the commission
 * chunk DETACHES AND STAYS — permanently visible with its own "−$7.50 to
 * the apps" label, so the end state explains itself with zero motion.
 * Legend + a plain-words explainer under the bars. Plays once on scroll,
 * replayable. Transform/opacity only.
 */
export function DollarComparison() {
  const t = useTranslations("site.dollar");
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "fill" | "break" | "done">("idle");
  const played = useRef(false);
  const [appsKeep, setAppsKeep] = useState(3000);

  const play = () => {
    setPhase("fill");
    setAppsKeep(3000);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("done");
      setAppsKeep(2250);
      return;
    }
    // slower, readable timeline: fill 1s · hold 0.6s · break 1.4s
    setTimeout(() => setPhase("break"), 1600);
    const t0 = performance.now();
    const count = (now: number) => {
      const p = Math.min(Math.max((now - t0 - 1600) / 1200, 0), 1);
      setAppsKeep(3000 - 750 * p);
      if (p < 1) requestAnimationFrame(count);
    };
    requestAnimationFrame(count);
    setTimeout(() => {
      setPhase("done");
      setAppsKeep(2250);
    }, 3100);
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
  const fmt = (cents: number) => "$" + (cents / 100).toFixed(2);

  return (
    <div ref={ref} className="flex flex-col gap-8">
      {/* legend — always visible so the colors never need guessing */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-charcoal">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded bg-olive" aria-hidden />
          {t("legendKeep")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded bg-[#C0392B]" aria-hidden />
          {t("legendApps")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-2 rounded bg-brass brightness-125" aria-hidden />
          {t("legendFee")}
        </span>
      </div>

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
            {t("keeps", { amount: fmt(appsKeep) })}
          </p>
        </div>
        <div className="relative mt-3 h-12" dir="ltr">
          {/* keeps portion (75%) — dollar figure lives inside the bar */}
          <div
            className={cn(
              "absolute inset-y-0 start-0 flex items-center overflow-hidden rounded-s-xl bg-olive ps-3 transition-[width] duration-[1000ms] ease-out",
              filling ? "w-[72%]" : "w-0",
            )}
          >
            <span
              className={cn(
                "text-sm font-bold whitespace-nowrap text-ivory transition-opacity duration-500",
                breaking ? "opacity-100" : "opacity-0",
              )}
            >
              $22.50
            </span>
          </div>
          {/* the commission chunk: detaches, slides a visible gap, STAYS */}
          <div
            className={cn(
              "absolute inset-y-0 start-[73%] flex w-[24%] items-center justify-center rounded-e-xl bg-[#C0392B] transition-all duration-[1400ms] ease-out",
              !filling && "opacity-0",
              filling && !breaking && "rounded-s-none opacity-100",
              breaking && "translate-x-3 rotate-1 rounded-s-xl opacity-100 shadow-lg",
            )}
          >
            <span
              className={cn(
                "text-sm font-bold whitespace-nowrap text-white transition-opacity duration-500",
                breaking ? "opacity-100" : "opacity-0",
              )}
              dir="ltr"
            >
              −$7.50
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm font-semibold text-[#C0392B]" dir="auto">
          {breaking ? t("appsLoss", { amount: "$7.50" }) : " "}
        </p>
        <p className="mt-1 text-sm text-stone">{t("appsCaption")}</p>
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
            {t("keeps", { amount: "$30.00" })}
          </p>
        </div>
        <div className="relative mt-3 h-12" dir="ltr">
          <div
            className={cn(
              "absolute inset-y-0 start-0 flex items-center overflow-hidden rounded-xl bg-olive ps-3 transition-[width] duration-[1000ms] ease-out",
              filling ? "w-full" : "w-0",
            )}
          >
            <span
              className={cn(
                "text-sm font-bold whitespace-nowrap text-ivory transition-opacity duration-500",
                breaking ? "opacity-100" : "opacity-0",
              )}
            >
              $30.00
            </span>
          </div>
          {/* the 79¢ sliver — diner-paid, sits just outside the bar */}
          <div
            className={cn(
              "absolute inset-y-1 w-2 rounded-full bg-brass brightness-125 transition-all delay-1000 duration-700",
              breaking ? "end-[-18px] opacity-100" : "end-2 opacity-0",
            )}
            aria-hidden
          />
        </div>
        <p className="mt-2 text-sm text-stone">79¢, {t("sofratakCaption")}</p>
      </div>

      {/* plain-words explainer — the story in one sentence, no motion needed */}
      <p className="rounded-xl bg-olive/[0.05] px-4 py-3 text-center text-sm leading-relaxed text-charcoal">
        {t("explain")}
      </p>

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
