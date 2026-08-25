import "server-only";
import { getCachedResult, setCachedResult } from "./cache";
import { getPlaceDetails } from "./places";
import { scanPageSpeed } from "./pagespeed";
import { scanWebsite } from "./website-scan";
import { scoreGrade } from "./score";
import { EAT_METROS } from "@/content/eat-metros";
import { getStore } from "@/lib/db/store";
import type { GraderCompetition, GraderResult, WebsiteScan, PageSpeedScan } from "./types";

const EMPTY_WEBSITE_SCAN: WebsiteScan = {
  checked: false,
  https: false,
  mobileFriendly: false,
  orderingPlatform: null,
  marketplaceLinks: [],
  fetchError: false,
};
const EMPTY_PAGESPEED_SCAN: PageSpeedScan = { checked: false, performanceScore: null };

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Competition row (design-pass-4 §3): published /eat listings within
 * ~3 miles of the graded restaurant — our own directory data. Null when
 * the place has no coordinates or sits outside all metros.
 */
async function nearbyCompetition(lat: number | null, lng: number | null): Promise<GraderCompetition | null> {
  if (lat === null || lng === null) return null;
  try {
    const store = getStore();
    const here = { lat, lng };
    const nearby: Array<{ name: string; d: number }> = [];
    for (const metro of EAT_METROS) {
      // cheap bbox pre-check: skip metros whose center is >150mi away
      if (haversineMi(here, metro.center) > 150) continue;
      for (const l of await store.listDirectory(metro.slug)) {
        if (!l.published || l.lat === null || l.lng === null) continue;
        const d = haversineMi(here, { lat: l.lat, lng: l.lng });
        if (d <= 3) nearby.push({ name: l.name, d });
      }
    }
    if (nearby.length === 0) return null;
    nearby.sort((a, b) => a.d - b.d);
    return { count: nearby.length, names: nearby.slice(0, 3).map((n) => n.name) };
  } catch (err) {
    console.error("[grader] competition lookup failed", err);
    return null;
  }
}

export type RunGradeResult =
  | { ok: true; result: GraderResult }
  | { ok: false; error: "rate_limited" | "not_configured" | "request_failed" };

export async function runGrade(placeId: string, sessionToken: string): Promise<RunGradeResult> {
  const cached = await getCachedResult(placeId);
  if (cached) {
    // competition is never cached — recompute from our own directory
    // (pre-pass-4 cache entries have no coords → stays null)
    const competition = await nearbyCompetition(
      cached.signals.place.lat ?? null,
      cached.signals.place.lng ?? null,
    );
    return { ok: true, result: { ...cached, competition } };
  }

  const detailsResult = await getPlaceDetails(placeId, sessionToken);
  if (!detailsResult.ok) return detailsResult;

  const [website, pageSpeed] = await Promise.all([
    detailsResult.details.website ? scanWebsite(detailsResult.details.website) : Promise.resolve(EMPTY_WEBSITE_SCAN),
    detailsResult.details.website
      ? scanPageSpeed(detailsResult.details.website)
      : Promise.resolve(EMPTY_PAGESPEED_SCAN),
  ]);

  const signals = { place: detailsResult.details, website, pageSpeed };
  const score = scoreGrade(signals);
  const competition = await nearbyCompetition(
    detailsResult.details.lat,
    detailsResult.details.lng,
  );
  const result: GraderResult = {
    placeId,
    restaurantName: detailsResult.details.name,
    signals,
    score,
    competition,
  };

  await setCachedResult(result);
  return { ok: true, result };
}
