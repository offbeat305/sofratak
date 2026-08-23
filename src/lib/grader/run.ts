import "server-only";
import { getCachedResult, setCachedResult } from "./cache";
import { getPlaceDetails } from "./places";
import { scanPageSpeed } from "./pagespeed";
import { scanWebsite } from "./website-scan";
import { scoreGrade } from "./score";
import type { GraderResult, WebsiteScan, PageSpeedScan } from "./types";

const EMPTY_WEBSITE_SCAN: WebsiteScan = {
  checked: false,
  https: false,
  mobileFriendly: false,
  orderingPlatform: null,
  marketplaceLinks: [],
  fetchError: false,
};
const EMPTY_PAGESPEED_SCAN: PageSpeedScan = { checked: false, performanceScore: null };

export type RunGradeResult =
  | { ok: true; result: GraderResult }
  | { ok: false; error: "rate_limited" | "not_configured" | "request_failed" };

export async function runGrade(placeId: string, sessionToken: string): Promise<RunGradeResult> {
  const cached = await getCachedResult(placeId);
  if (cached) return { ok: true, result: cached };

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
  const result: GraderResult = {
    placeId,
    restaurantName: detailsResult.details.name,
    signals,
    score,
  };

  await setCachedResult(result);
  return { ok: true, result };
}
