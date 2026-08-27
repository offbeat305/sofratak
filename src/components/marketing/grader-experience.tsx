"use client";
import { Button } from "@/components/marketing/button";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Check,
  CircleCheck,
  Lock,
  MapPin,
  Printer,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { CountUp } from "@/components/marketing/count-up";
import {
  autocompleteGraderAction,
  runGraderAction,
  unlockGraderReportAction,
} from "@/app/[locale]/(marketing)/grader/actions";
import type {
  GraderCategoryScore,
  GraderResult,
  GraderSignals,
  PlacePrediction,
} from "@/lib/grader/types";

type Stage = "search" | "scanning" | "result";

const CATEGORY_KEYS = ["googleProfile", "reviews", "website", "onlineOrdering"] as const;
const SCAN_STAGE_COUNT = 4;
const SCAN_STAGE_MIN_MS = 650;

function newSessionToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** Ring color per spec: brass ≥80, olive 60–79, clay <60 (usability exception). */
function ringColor(score: number): string {
  if (score >= 80) return "#a9792b";
  if (score >= 60) return "#2f4a3c";
  return "#a56b52";
}

type FindingRow = { tone: "ok" | "bad" | "warn"; text: string };

/**
 * Real findings per category (design-pass-4 §3): positives derived from
 * the raw signals, negatives from the scorer's finding keys — so every
 * card reads like an audit, not a bar chart.
 */
function categoryRows(
  category: GraderCategoryScore,
  signals: GraderSignals,
  t: ReturnType<typeof useTranslations>,
): FindingRow[] {
  const f = new Set(category.findings);
  const neg = (key: string): FindingRow => ({ tone: "bad", text: t(`findings.${key}`) });
  const warn = (key: string): FindingRow => ({ tone: "warn", text: t(`findings.${key}`) });
  const ok = (key: string, values?: Record<string, string | number>): FindingRow => ({
    tone: "ok",
    text: t(`positives.${key}`, values),
  });

  switch (category.key) {
    case "googleProfile":
      return [
        f.has("no_website_on_profile") ? neg("no_website_on_profile") : ok("hasWebsite"),
        f.has("no_phone_on_profile") ? neg("no_phone_on_profile") : ok("hasPhone"),
        f.has("no_hours_on_profile") ? neg("no_hours_on_profile") : ok("hasHours"),
      ];
    case "reviews": {
      if (f.has("no_reviews")) return [neg("no_reviews")];
      const rows: FindingRow[] = [
        ok("ratingLine", {
          rating: signals.place.rating?.toFixed(1) ?? "",
          count: Intl.NumberFormat().format(signals.place.userRatingCount ?? 0),
        }),
      ];
      if (f.has("low_rating")) rows.push(warn("low_rating"));
      if (f.has("low_review_count")) rows.push(warn("low_review_count"));
      return rows;
    }
    case "website": {
      if (f.has("no_website")) return [neg("no_website")];
      if (f.has("website_unreachable")) return [neg("website_unreachable")];
      const rows: FindingRow[] = [
        f.has("no_https") ? neg("no_https") : ok("httpsOk"),
        f.has("not_mobile_friendly") ? neg("not_mobile_friendly") : ok("mobileOk"),
      ];
      if (f.has("slow_site")) rows.push(warn("slow_site"));
      else if (signals.pageSpeed.checked) rows.push(ok("fastSite"));
      return rows;
    }
    case "onlineOrdering":
      return category.findings.map((key) =>
        key === "already_on_sofratak"
          ? { tone: "ok", text: t(`findings.${key}`) }
          : key === "ordering_unknown" || key === "has_paid_ordering_platform"
            ? warn(key)
            : neg(key),
      );
  }
}

function RowIcon({ tone }: { tone: FindingRow["tone"] }) {
  if (tone === "ok") return <Check className="mt-0.5 size-4 shrink-0 text-positive" aria-hidden />;
  if (tone === "bad") return <X className="mt-0.5 size-4 shrink-0 text-error" aria-hidden />;
  return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-clay" aria-hidden />;
}

/** Animated SVG ring gauge — stroke draws to the score, number counts up. */
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const r = 70;
  const c = 2 * Math.PI * r;
  const color = ringColor(score);
  return (
    <div className="relative size-44">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(247,242,232,0.15)" strokeWidth="11" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={drawn ? c * (1 - score / 100) : c}
          className="transition-[stroke-dashoffset] duration-1000 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold text-ivory">{grade}</span>
        <span className="text-sm font-semibold text-ivory/70" dir="ltr">
          <CountUp value={score} />
          /100
        </span>
      </div>
    </div>
  );
}

/**
 * The /grader experience (design-pass-4): landing hero with the glowing
 * search as the focal object; a staged scan screen that ticks with the
 * real API work; and an audit-style report — ring gauge, four findings
 * cards, the money slide, the directory-powered competition row, and
 * the redesigned unlock gate. `children` = the server-rendered landing
 * sections, visible only before a scan starts.
 */
export function GraderExperience({ children }: { children: React.ReactNode }) {
  const t = useTranslations("site.grader");
  const locale = useLocale() as "en" | "ar";

  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [scanName, setScanName] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [sessionToken, setSessionToken] = useState(newSessionToken);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GraderResult | null>(null);
  const [scanStep, setScanStep] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [unlockState, setUnlockState] = useState<"idle" | "sending" | "error">("idle");

  const scanStages = t.raw("scanStages") as string[];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setPredictions([]);
      setError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await autocompleteGraderAction(query, sessionToken, locale);
      if (res.ok) {
        setPredictions(res.predictions);
        setError(null);
      } else {
        setError(res.error === "not_configured" ? "notConfigured" : "error");
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, sessionToken, locale]);

  const selectPrediction = async (prediction: PlacePrediction) => {
    setPredictions([]);
    setScanName(prediction.description.split(",")[0]);
    setStage("scanning");
    setScanStep(0);
    setError(null);

    // Stage theater synced to the real work: tick at a readable pace
    // while the action runs; when it resolves, fast-forward the rest.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = runGraderAction(prediction.placeId, sessionToken);
    let step = 0;
    const tick = () =>
      new Promise<void>((resolve) => setTimeout(resolve, reduced ? 0 : SCAN_STAGE_MIN_MS));
    while (step < SCAN_STAGE_COUNT - 1) {
      await tick();
      step += 1;
      setScanStep(step);
    }
    const res = await run;
    await tick();
    setScanStep(SCAN_STAGE_COUNT);
    if (!res.ok) {
      setError(res.error === "not_configured" ? "notConfigured" : "error");
      setStage("search");
      return;
    }
    setTimeout(() => {
      setResult(res.result);
      setStage("result");
      window.scrollTo({ top: 0 });
    }, reduced ? 0 : 350);
  };

  const reset = () => {
    setStage("search");
    setQuery("");
    setPredictions([]);
    setResult(null);
    setUnlocked(false);
    setEmail("");
    setUnlockState("idle");
    setSessionToken(newSessionToken());
    window.scrollTo({ top: 0 });
  };

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    setUnlockState("sending");
    const res = await unlockGraderReportAction({
      placeId: result.placeId,
      restaurantName: result.restaurantName,
      email,
      locale,
      score: result.score,
      website,
    });
    if (res.ok) {
      setUnlocked(true);
      setUnlockState("idle");
    } else {
      setUnlockState("error");
    }
  };

  /* ── landing hero + sections ─────────────────────────────────────── */
  if (stage === "search") {
    return (
      <>
        <section id="grader-hero" className="hero-ambient olive-luminous relative bg-olive text-ivory">
          <div className="relative mx-auto max-w-3xl px-4 pt-28 pb-16 text-center sm:px-6 md:pt-36 md:pb-20">
            <p className="text-xs font-semibold tracking-[0.18em] text-brass uppercase brightness-150">
              {t("heroEyebrow")}
            </p>
            <h1 className="font-display mt-3 text-[clamp(30px,5vw,52px)] leading-[1.08] font-bold">
              {t("heroH1")} <span className="gradient-text-brass">{t("heroH1Brass")}</span>
            </h1>

            {/* the glowing focal object */}
            <div className="edge-light glow-brass glow-hover relative mx-auto mt-8 max-w-xl rounded-card bg-ivory/95 p-2 backdrop-blur-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 start-4 size-5 -translate-y-1/2 text-stone" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-14 w-full rounded-[14px] bg-transparent ps-12 pe-4 text-[17px] text-charcoal placeholder:text-stone focus:outline-none"
                />
              </div>
              {predictions.length > 0 && (
                <ul className="animate-fade-in absolute inset-x-2 top-full z-20 mt-1 overflow-hidden rounded-card border border-olive/10 bg-white text-start shadow-[0_18px_44px_rgba(24,38,31,0.25)]">
                  {predictions.map((p) => (
                    <li key={p.placeId}>
                      <button
                        type="button"
                        onClick={() => selectPrediction(p)}
                        className="flex w-full items-start gap-2.5 px-4 py-3 text-[15px] text-charcoal transition-colors hover:bg-sand-soft/60"
                      >
                        <MapPin className="mt-0.5 size-4 shrink-0 text-brass" aria-hidden />
                        {p.description}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="mt-4 text-sm text-ivory/70">{t("heroSub")}</p>
            {error && (
              <p role="alert" className="mt-3 text-sm font-semibold text-[#ffb4a8]">
                {t(error)}
              </p>
            )}
          </div>
        </section>
        {children}
      </>
    );
  }

  /* ── the scan moment ─────────────────────────────────────────────── */
  if (stage === "scanning") {
    return (
      <section className="hero-ambient olive-luminous relative min-h-dvh bg-olive text-ivory">
        <div className="relative mx-auto max-w-xl px-4 pt-32 pb-16 sm:px-6">
          <p className="font-display text-2xl font-bold sm:text-3xl">
            {t("grading", { name: scanName })}
          </p>

          {/* progress bar */}
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-ivory/15">
            <div
              className="h-full rounded-full bg-brass transition-[width] duration-500 ease-out"
              style={{ width: `${(scanStep / SCAN_STAGE_COUNT) * 100}%` }}
            />
          </div>

          <ul className="mt-8 flex flex-col gap-4">
            {scanStages.map((label, i) => (
              <li key={label} className="flex items-center gap-3 text-[15px]">
                {i < scanStep ? (
                  <CircleCheck className="size-5 shrink-0 text-brass brightness-125" aria-hidden />
                ) : i === scanStep ? (
                  <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-ivory/30 border-t-brass" aria-hidden />
                ) : (
                  <span className="size-4 shrink-0 rounded-full border-2 border-ivory/20" aria-hidden />
                )}
                <span className={cn(i <= scanStep ? "text-ivory" : "text-ivory/45")}>{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-col gap-3" aria-hidden>
            <div className="skeleton h-24 rounded-card opacity-30" />
            <div className="skeleton h-14 rounded-card opacity-20" />
          </div>
        </div>
      </section>
    );
  }

  /* ── the report ──────────────────────────────────────────────────── */
  if (!result) return null;
  const { score, restaurantName, signals, competition } = result;
  const hasImpact = score.estimatedMonthlyImpactHighCents > 0;
  const verdict =
    score.overall >= 80 ? t("verdictHigh") : score.overall >= 60 ? t("verdictMid") : t("verdictLow");

  return (
    <div className="print:bg-white">
      {/* score hero */}
      <section className="hero-ambient olive-luminous relative bg-olive text-ivory print:bg-white print:text-charcoal">
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pt-28 pb-12 text-center sm:px-6">
          <p className="text-sm text-ivory/70 print:text-stone">{t("gradeHeadline", { name: restaurantName })}</p>
          <div className="mt-5">
            <ScoreRing score={score.overall} grade={score.grade} />
          </div>
          <p className="mt-5 max-w-md text-lg font-semibold">{verdict}</p>
        </div>
      </section>

      <div className="texture-dots mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* the money slide */}
        {hasImpact ? (
          <div className="edge-light glow-brass rounded-card bg-olive p-6 text-ivory sm:p-8">
            <p className="text-sm font-semibold text-ivory/70">{t("moneyTitle")}</p>
            <p className="font-display mt-2 text-3xl font-bold text-brass brightness-150 sm:text-4xl" dir="ltr">
              $<CountUp value={score.estimatedMonthlyImpactLowCents / 100} />–$
              <CountUp value={score.estimatedMonthlyImpactHighCents / 100} />
              <span className="text-base font-normal text-ivory/60"> /mo</span>
            </p>
            <p className="mt-2 text-sm text-ivory/70">{t("impactNote")}</p>
            <Button href="/calculator" size="sm" className="mt-4">
              {t("moneyCta")}
            </Button>
          </div>
        ) : (
          <p className="flex items-center gap-2 font-semibold text-positive">
            <CircleCheck className="size-5 shrink-0" aria-hidden />
            {t("impactZero")}
          </p>
        )}

        {/* category cards */}
        <div className="relative mt-6 grid gap-4 sm:grid-cols-2">
          {CATEGORY_KEYS.map((key) => {
            const category = score.categories.find((c) => c.key === key);
            if (!category) return null;
            const rows = categoryRows(category, signals, t);
            return (
              <div key={key} className="card-crisp rounded-card bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-olive">{t(`categories.${key}`)}</p>
                  <p className="text-sm font-bold text-charcoal" dir="ltr">
                    {category.score}/100
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-olive/10">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${category.score}%`, backgroundColor: ringColor(category.score) }}
                  />
                </div>
                <ul
                  className={cn(
                    "mt-3 flex flex-col gap-2 text-sm text-charcoal",
                    !unlocked && "pointer-events-none blur-[5px] select-none",
                  )}
                  aria-hidden={!unlocked}
                >
                  {rows.map((row) => (
                    <li key={row.text} className="flex gap-2">
                      <RowIcon tone={row.tone} />
                      {row.text}
                    </li>
                  ))}
                  <li className="mt-1 border-t border-olive/10 pt-2 text-sm font-semibold text-olive">
                    {t(`recs.${key}`)}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>

        {/* redesigned unlock gate */}
        {!unlocked && (
          <div className="edge-light glow-brass mt-6 rounded-card bg-ivory/90 p-6 backdrop-blur-md">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-olive">
              <Lock className="size-4.5" aria-hidden />
              {t("unlockTitle")}
            </p>
            <p className="mt-1 text-sm text-stone">{t("unlockSub")}</p>
            <form onSubmit={unlock} className="mt-4 flex flex-col gap-2 sm:flex-row">
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
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                className="h-12 flex-1 rounded-field border border-olive/20 bg-white px-4 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
              <Button type="submit" disabled={unlockState === "sending"} className="shrink-0">
                {unlockState === "sending" ? t("unlocking") : t("unlock")}
              </Button>
            </form>
            {unlockState === "error" && (
              <p role="alert" className="mt-2 text-sm font-semibold text-error">
                {t("error")}
              </p>
            )}
          </div>
        )}

        {/* competition row — our own directory data */}
        {competition && competition.count > 0 && (
          <div className="card-crisp mt-6 rounded-card bg-white p-6">
            <p className="font-display text-lg font-bold text-olive">{t("competitionTitle")}</p>
            <p className="mt-1 text-sm text-charcoal">
              {t("competitionLine", { count: competition.count })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {competition.names.map((name) => (
                <span
                  key={name}
                  aria-hidden
                  className="rounded-full bg-olive/8 px-3.5 py-1.5 text-sm font-semibold text-charcoal blur-[4px] select-none"
                >
                  {name}
                </span>
              ))}
            </div>
            <Link
              href="/eat"
              className="mt-3 inline-block text-sm font-bold text-brass-deep underline-offset-4 hover:underline"
            >
              {t("competitionCta")} →
            </Link>
          </div>
        )}

        {unlocked && (
          <div className="card-crisp mt-6 rounded-card bg-white p-5">
            <p className="text-xs font-semibold text-stone">{t("methodologyTitle")}</p>
            <p className="mt-1 text-xs text-stone">{t("methodologyBody")}</p>
          </div>
        )}

        {unlocked && (
          <div className="mt-6 rounded-card bg-sand-soft/60 p-5 text-center sm:p-6">
            <p className="font-display text-xl font-bold text-olive">{t("ctaTitle")}</p>
            <p className="mt-1 text-stone">{t("ctaBody")}</p>
            <Button href={`/demo?restaurant=${encodeURIComponent(restaurantName)}`} className="mt-4">
              {t("ctaButton")}
            </Button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-6 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone hover:text-olive"
          >
            <Printer className="size-3.5" aria-hidden />
            {t("printReport")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone hover:text-olive"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {t("regrade")}
          </button>
        </div>
      </div>
    </div>
  );
}
