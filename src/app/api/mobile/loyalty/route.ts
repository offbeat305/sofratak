import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { allowRequest } from "@/lib/rate-limit";

const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

/**
 * Punch-card status for the phone the diner typed at checkout — the
 * mobile twin of getLoyaltyStatusAction, same tight rate limit for the
 * same reason (this is the phone-enumeration surface; a real diner looks
 * up one number). Phone is the loyalty identity by design: no accounts.
 */
export async function POST(request: Request) {
  if (!(await allowRequest("loyalty-status", 15))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  let body: { restaurantSlug?: unknown; phone?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const slug = String(body.restaurantSlug ?? "");
  const phone = String(body.phone ?? "").trim();
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ loyalty: null });
  }
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant || !restaurant.loyaltySettings.enabled) {
    return NextResponse.json({ loyalty: null });
  }
  const account = await store.getLoyaltyAccount(restaurant.id, phone);
  return NextResponse.json({
    loyalty: {
      punches: account?.points ?? 0,
      rewards: restaurant.loyaltySettings.rewards.map((r) => ({
        id: r.id,
        name: r.name,
        punchesNeeded: r.pointsCost,
        valueCents: r.valueCents,
      })),
    },
  });
}
