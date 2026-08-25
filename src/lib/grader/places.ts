import "server-only";
import type { PlaceDetails, PlacePrediction } from "./types";
import { tryConsumeAutocomplete, tryConsumeDetails } from "./usage-cap";

const FIELD_MASK = [
  "displayName",
  "location",
  "photos.name",
  "formattedAddress",
  "internationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "regularOpeningHours.weekdayDescriptions",
  "businessStatus",
].join(",");

function apiKey(): string | null {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

/**
 * Session-token billing: Google bundles every Autocomplete request that
 * shares a session token, plus the Details call that ends the session,
 * into a single Autocomplete charge. Callers must reuse one token for a
 * whole "type → pick a result" flow and discard it after.
 */
export type AutocompleteResult =
  | { ok: true; predictions: PlacePrediction[] }
  | { ok: false; error: "rate_limited" | "not_configured" | "request_failed" };

export async function autocompleteRestaurant(
  input: string,
  sessionToken: string,
  locale: "en" | "ar",
): Promise<AutocompleteResult> {
  const key = apiKey();
  if (!key) return { ok: false, error: "not_configured" };
  if (!(await tryConsumeAutocomplete())) return { ok: false, error: "rate_limited" };

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input,
        sessionToken,
        includedPrimaryTypes: ["restaurant"],
        includedRegionCodes: ["us"],
        languageCode: locale,
        regionCode: "us",
      }),
    });
    if (!res.ok) return { ok: false, error: "request_failed" };
    const data = (await res.json()) as {
      suggestions?: Array<{
        placePrediction?: { placeId: string; text: { text: string } };
      }>;
    };
    const predictions = (data.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is { placeId: string; text: { text: string } } => Boolean(p))
      .map((p) => ({ placeId: p.placeId, description: p.text.text }));
    return { ok: true, predictions };
  } catch (err) {
    console.error("[grader] autocomplete failed", err);
    return { ok: false, error: "request_failed" };
  }
}

export type PlaceDetailsResult =
  | { ok: true; details: PlaceDetails }
  | { ok: false; error: "rate_limited" | "not_configured" | "request_failed" };

export async function getPlaceDetails(
  placeId: string,
  sessionToken: string,
): Promise<PlaceDetailsResult> {
  const key = apiKey();
  if (!key) return { ok: false, error: "not_configured" };
  if (!(await tryConsumeDetails())) return { ok: false, error: "rate_limited" };

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`;
    const res = await fetch(url, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
    });
    if (!res.ok) return { ok: false, error: "request_failed" };
    const data = (await res.json()) as {
      displayName?: { text: string };
      location?: { latitude: number; longitude: number };
      photos?: Array<{ name: string }>;
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
      regularOpeningHours?: { weekdayDescriptions?: string[] };
      businessStatus?: string;
    };
    return {
      ok: true,
      details: {
        placeId,
        name: data.displayName?.text ?? "",
        lat: data.location?.latitude ?? null,
        lng: data.location?.longitude ?? null,
        photoName: data.photos?.[0]?.name ?? null,
        formattedAddress: data.formattedAddress ?? null,
        phone: data.internationalPhoneNumber ?? null,
        website: data.websiteUri ?? null,
        rating: data.rating ?? null,
        userRatingCount: data.userRatingCount ?? null,
        openingHoursText: data.regularOpeningHours?.weekdayDescriptions ?? null,
        businessStatus: data.businessStatus ?? null,
      },
    };
  } catch (err) {
    console.error("[grader] place details failed", err);
    return { ok: false, error: "request_failed" };
  }
}
