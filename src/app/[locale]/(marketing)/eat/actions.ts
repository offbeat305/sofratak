"use server";

import { captureLead } from "@/lib/leads";
import { allowRequest } from "@/lib/rate-limit";
import { getStore } from "@/lib/db/store";
import { getLiveEnrichment, type LiveEnrichment } from "@/lib/eat/places-live";

/**
 * Live Google enrichment for UNCLAIMED listings only — claimed listings
 * show their own storefront data, and the demo restaurant's place_id is
 * a false-positive match anyway. Returns null quietly on any miss; the
 * page renders fine without it.
 */
export async function getListingEnrichmentAction(
  city: string,
  slug: string,
): Promise<LiveEnrichment | null> {
  // 120/min: metro-page cards lazy-load photos through this too — a fast
  // scroller can legitimately fire dozens; the Places daily cap is the
  // real spend guard, this only blunts scripted abuse.
  if (!(await allowRequest("eat-enrich", 120))) return null;
  const listing = await getStore().getDirectoryListing(city, slug);
  if (!listing || !listing.published || listing.claimedRestaurantId || !listing.googlePlaceId) {
    return null;
  }
  return getLiveEnrichment(listing.googlePlaceId);
}

const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SuggestInput = {
  restaurantName: string;
  city: string;
  address: string;
  /** submitter contact — optional; suggestions are welcome anonymously */
  phone: string;
  note: string;
  locale: "en" | "ar";
  /** honeypot — real users never fill this */
  website?: string;
};

/**
 * Community "Add a restaurant" suggestions — the long-term coverage
 * engine. Writes a lead (kind 'suggestion') for MANUAL review; a
 * suggestion never auto-publishes a listing.
 */
export async function suggestRestaurantAction(
  input: SuggestInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await allowRequest("directory-suggest", 5))) {
    return { ok: false, error: "rate" };
  }
  if (input.website) return { ok: true }; // honeypot — pretend success

  const restaurantName = input.restaurantName.trim().slice(0, 120);
  if (!restaurantName) return { ok: false, error: "name" };
  const phone = input.phone.trim();
  if (phone && !PHONE_RE.test(phone)) return { ok: false, error: "phone" };

  await captureLead({
    kind: "suggestion",
    name: restaurantName,
    phone,
    restaurant: restaurantName,
    city: input.city.trim().slice(0, 80) || null,
    message: [input.address.trim().slice(0, 200), input.note.trim().slice(0, 300)]
      .filter(Boolean)
      .join(" — ") || null,
    locale: input.locale === "ar" ? "ar" : "en",
  });
  return { ok: true };
}

export type ClaimInput = {
  listingId: string;
  listingName: string;
  city: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  /** true when submitted via the takedown link — same-day handling promise */
  takedown: boolean;
  locale: "en" | "ar";
  /** honeypot — real users never fill this */
  website?: string;
};

/**
 * "Claim this restaurant" — the directory's sales funnel
 * (docs/directory-spec.md). A claim is a lead Zizo closes personally;
 * there is deliberately NO self-serve claiming in v1. Takedowns ride the
 * same pipe with a flag and get same-day manual handling (legal
 * guardrail #3).
 */
export async function submitClaimAction(
  input: ClaimInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await allowRequest("directory-claim", 5))) {
    return { ok: false, error: "rate" };
  }
  if (input.website) return { ok: true }; // honeypot — pretend success

  const name = input.name.trim().slice(0, 80);
  const phone = input.phone.trim();
  const email = input.email.trim().slice(0, 120);
  if (!name) return { ok: false, error: "name" };
  if (!PHONE_RE.test(phone)) return { ok: false, error: "phone" };
  if (email && !EMAIL_RE.test(email)) return { ok: false, error: "email" };

  await captureLead({
    kind: "claim",
    name,
    phone,
    email: email || null,
    restaurant: input.listingName.trim().slice(0, 120) || null,
    city: input.city.trim().slice(0, 80) || null,
    message: input.role.trim().slice(0, 120) || null,
    data: {
      listingId: input.listingId,
      takedown: input.takedown,
    },
    locale: input.locale === "ar" ? "ar" : "en",
  });
  return { ok: true };
}
