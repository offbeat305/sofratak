import "server-only";
import type { PageSpeedScan } from "./types";

const TIMEOUT_MS = 15_000;

/**
 * Free (no billing account needed) — Google's own free-tier Core Web
 * Vitals/Lighthouse-as-a-service. Works unauthenticated at lower quota;
 * reuses GOOGLE_PLACES_API_KEY when set (same Google Cloud project).
 */
export async function scanPageSpeed(url: string): Promise<PageSpeedScan> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const params = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
    if (key) params.set("key", key);
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`,
      { signal: controller.signal },
    );
    if (!res.ok) return { checked: false, performanceScore: null };
    const data = (await res.json()) as {
      lighthouseResult?: { categories?: { performance?: { score?: number } } };
    };
    const score = data.lighthouseResult?.categories?.performance?.score;
    return {
      checked: true,
      performanceScore: typeof score === "number" ? Math.round(score * 100) : null,
    };
  } catch (err) {
    console.error("[grader] pagespeed scan failed", err);
    return { checked: false, performanceScore: null };
  } finally {
    clearTimeout(timeout);
  }
}
