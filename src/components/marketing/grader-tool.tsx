"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Lock, CircleCheck, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CountUp } from "@/components/marketing/count-up";
import {
  autocompleteGraderAction,
  runGraderAction,
  unlockGraderReportAction,
} from "@/app/[locale]/(marketing)/grader/actions";
import type { PlacePrediction, GraderResult } from "@/lib/grader/types";

type Stage = "search" | "grading" | "result";

const CATEGORY_KEYS = ["googleProfile", "reviews", "website", "onlineOrdering"] as const;

function newSessionToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function GraderTool() {
  const t = useTranslations("site.grader");
  const locale = useLocale() as "en" | "ar";

  const [stage, setStage] = useState<Stage>("search");
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [sessionToken, setSessionToken] = useState(newSessionToken);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GraderResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [unlockState, setUnlockState] = useState<"idle" | "sending" | "error">("idle");

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

  const selectPrediction = (prediction: PlacePrediction) => {
    setPredictions([]);
    setQuery(prediction.description);
    setStage("grading");
    setError(null);
    startTransitionGrade(prediction.placeId);
  };

  const startTransitionGrade = async (placeId: string) => {
    const res = await runGraderAction(placeId, sessionToken);
    if (!res.ok) {
      setError(res.error === "not_configured" ? "notConfigured" : "error");
      setStage("search");
      return;
    }
    setResult(res.result);
    setStage("result");
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

  if (stage === "search" || stage === "grading") {
    return (
      <div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            disabled={stage === "grading"}
            className="h-12 w-full rounded-field border border-olive/20 bg-white ps-10 pe-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25 disabled:opacity-60"
          />
          {predictions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-field border border-olive/10 bg-white shadow-lg">
              {predictions.map((p) => (
                <li key={p.placeId}>
                  <button
                    type="button"
                    onClick={() => selectPrediction(p)}
                    className="block w-full px-3.5 py-2.5 text-start text-[15px] text-charcoal hover:bg-sand-soft/60"
                  >
                    {p.description}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-2 text-sm text-stone">{t("searchHint")}</p>

        {stage === "grading" && (
          <p className="mt-6 flex items-center gap-2 font-semibold text-olive" role="status">
            <span className="size-4 animate-spin rounded-full border-2 border-olive/30 border-t-olive" aria-hidden />
            {t("grading", { name: query })}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm font-semibold text-error">
            {t(error)}
          </p>
        )}
      </div>
    );
  }

  if (!result) return null;
  const { score, restaurantName } = result;
  const hasImpact = score.estimatedMonthlyImpactHighCents > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-card bg-olive p-6 text-ivory">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ivory/10 text-2xl font-bold sm:size-20 sm:text-3xl">
          {score.grade}
        </div>
        <div>
          <p className="text-sm text-ivory/70">{t("gradeHeadline", { name: restaurantName })}</p>
          <p className="font-display text-2xl font-bold">{score.overall}/100</p>
        </div>
      </div>

      {hasImpact ? (
        <div>
          <p className="text-sm font-semibold text-stone">{t("impactLabel")}</p>
          <p className="font-display text-3xl font-bold text-brass sm:text-4xl" dir="ltr">
            $<CountUp value={score.estimatedMonthlyImpactLowCents / 100} />–$
            <CountUp value={score.estimatedMonthlyImpactHighCents / 100} />
            <span className="text-base font-normal text-stone"> /mo</span>
          </p>
          <p className="mt-1 text-sm text-stone">{t("impactNote")}</p>
        </div>
      ) : (
        <p className="flex items-center gap-2 font-semibold text-positive">
          <CircleCheck className="size-5 shrink-0" aria-hidden />
          {t("impactZero")}
        </p>
      )}

      <div className="relative flex flex-col gap-3">
        {CATEGORY_KEYS.map((key) => {
          const category = score.categories.find((c) => c.key === key);
          if (!category) return null;
          return (
            <div key={key} className="rounded-card border border-olive/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="font-bold text-olive">{t(`categories.${key}`)}</p>
                <p className="text-sm font-semibold text-stone">{category.score}/100</p>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-olive/10">
                <div
                  className="h-full rounded-full bg-brass"
                  style={{ width: `${category.score}%` }}
                />
              </div>
              {unlocked && (
                <ul className="mt-2 flex flex-col gap-1 text-sm text-charcoal">
                  {category.findings.map((f) => (
                    <li key={f}>{t(`findings.${f}`)}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {!unlocked && (
          <div className="rounded-card border border-olive/10 bg-white/80 p-5 backdrop-blur-sm">
            <p className="flex items-center gap-2 font-bold text-olive">
              <Lock className="size-4" aria-hidden />
              {t("unlockTitle")}
            </p>
            <p className="mt-1 text-sm text-stone">{t("unlockSub")}</p>
            <form onSubmit={unlock} className="mt-3 flex flex-col gap-2 sm:flex-row">
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
                className="h-11 flex-1 rounded-field border border-olive/20 bg-white px-3.5 text-[15px] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
              />
              <button
                type="submit"
                disabled={unlockState === "sending"}
                className="h-11 shrink-0 rounded-btn bg-brass px-5 font-bold text-ivory transition-colors hover:bg-brass-deep disabled:opacity-50"
              >
                {unlockState === "sending" ? t("unlocking") : t("unlock")}
              </button>
            </form>
            {unlockState === "error" && (
              <p role="alert" className="mt-2 text-sm font-semibold text-error">
                {t("error")}
              </p>
            )}
          </div>
        )}
      </div>

      {unlocked && (
        <div className="rounded-card border border-olive/10 bg-white p-5">
          <p className="text-xs font-semibold text-stone">{t("methodologyTitle")}</p>
          <p className="mt-1 text-xs text-stone">{t("methodologyBody")}</p>
        </div>
      )}

      {unlocked && (
        <div className="rounded-card bg-sand-soft/60 p-5 text-center sm:p-6">
          <p className="font-display text-xl font-bold text-olive">{t("ctaTitle")}</p>
          <p className="mt-1 text-stone">{t("ctaBody")}</p>
          <Link
            href={`/demo?restaurant=${encodeURIComponent(restaurantName)}`}
            className="mt-4 inline-flex h-12 items-center justify-center rounded-btn bg-brass px-6 font-bold text-ivory transition-colors hover:bg-brass-deep"
          >
            {t("ctaButton")}
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 self-center text-sm font-semibold text-stone hover:text-olive"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        {t("regrade")}
      </button>
    </div>
  );
}
