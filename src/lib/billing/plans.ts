import type { SubscriptionTier } from "@/lib/db/types";

/**
 * Business constants (Zizo, see CLAUDE.md) — the single source of truth
 * for subscription pricing. The marketing pricing page (tier-cards.tsx)
 * imports these too, so the price a prospect sees can never drift from
 * what billing actually charges.
 */
export const PLANS: Record<SubscriptionTier, { name: string; priceCents: number }> = {
  starter: { name: "Starter", priceCents: 24_900 },
  growth: { name: "Growth", priceCents: 34_900 },
  partner: { name: "Partner", priceCents: 49_900 },
};

export const PLAN_ORDER: SubscriptionTier[] = ["starter", "growth", "partner"];
