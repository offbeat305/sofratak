import "server-only";
import { tryConsumeDetails } from "@/lib/grader/usage-cap";

/**
 * LIVE Places enrichment for unclaimed listing pages (Zizo's directive):
 * photos/rating/hours fetched at view time from the stored place_id and
 * displayed with Google attribution — never persisted. Google's ToS
 * allows live display but prohibits caching Places content; the only
 * stored artifact is the place ID (explicitly permitted). A short
 * in-memory TTL absorbs bursts within those limits; nothing touches the
 * database, and photos render via a streaming proxy + plain <img> so
 * no copy lands on our servers either.
 *
 * Reuses the Grader's daily-cap machinery so a scraper can't run up the
 * Places bill through listing pages.
 */

export type LiveEnrichment = {
  rating: number | null;
  userRatingCount: number | null;
  /** live street address — shown when the stored address is area-level only */
  formattedAddress: string | null;
  /** Google's editorial one-liner — shown unless a custom_blurb overrides it */
  editorialSummary: string | null;
  /** e.g. "Monday: 11:00 AM – 9:00 PM" lines, localized by Google */
  weekdayText: string[] | null;
  /** Places photo resource names — render via /api/eat/photo?name=… */
  photoNames: string[];
  /** photo author attributions (required display alongside photos) */
  photoAttributions: string[];
};

const TTL_MS = 5 * 60 * 1000; // short burst-absorber, not a cache store
const memo = new Map<string, { data: LiveEnrichment | null; expires: number }>();

export async function getLiveEnrichment(placeId: string): Promise<LiveEnrichment | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;

  const cached = memo.get(placeId);
  if (cached && cached.expires > Date.now()) return cached.data;

  if (!(await tryConsumeDetails())) return null; // daily cap hit — page still works

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "rating,userRatingCount,formattedAddress,editorialSummary,regularOpeningHours.weekdayDescriptions,photos.name,photos.authorAttributions",
        },
        cache: "no-store", // never let Next persist Places content
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      formattedAddress?: string;
      editorialSummary?: { text?: string };
      regularOpeningHours?: { weekdayDescriptions?: string[] };
      photos?: Array<{ name: string; authorAttributions?: Array<{ displayName?: string }> }>;
    };

    // 3–5 swipeable photos on the detail gallery (Zizo) — never all 10
    const photos = (data.photos ?? []).slice(0, 5);
    const enrichment: LiveEnrichment = {
      rating: data.rating ?? null,
      userRatingCount: data.userRatingCount ?? null,
      formattedAddress: data.formattedAddress ?? null,
      editorialSummary: data.editorialSummary?.text ?? null,
      weekdayText: data.regularOpeningHours?.weekdayDescriptions ?? null,
      photoNames: photos.map((p) => p.name),
      photoAttributions: [
        ...new Set(
          photos.flatMap((p) => (p.authorAttributions ?? []).map((a) => a.displayName ?? "")),
        ),
      ].filter(Boolean),
    };
    memo.set(placeId, { data: enrichment, expires: Date.now() + TTL_MS });
    return enrichment;
  } catch (err) {
    console.error("[places-live] enrichment failed", err);
    return null;
  }
}
