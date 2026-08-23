"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import {
  placeOrder,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "@/lib/orders/place-order";
import { getStore } from "@/lib/db/store";
import { allowRequest } from "@/lib/rate-limit";

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  // Also throttles brute-forcing offer codes through checkout attempts.
  if (!(await allowRequest("place-order", 10))) {
    return { ok: false, error: "Too many attempts — wait a minute and try again" };
  }
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return placeOrder(input, `${proto}://${host}`);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIRTHDAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

export type LoyaltyStatus = {
  enabled: boolean;
  punches: number;
  rewards: Array<{
    id: string;
    name: { en: string; ar: string };
    punchesNeeded: number;
    valueCents: number;
  }>;
};

/**
 * Punch-card status for the phone number the diner just typed at
 * checkout. Exposes only a punch count + the public reward catalog —
 * the phone number is the loyalty identity by design (no app, no
 * password), same model as the big loyalty platforms.
 */
export async function getLoyaltyStatusAction(
  restaurantSlug: string,
  phone: string,
): Promise<LoyaltyStatus | null> {
  // Tight limit: this is the phone-enumeration surface (punch counts by
  // typed phone number). A real diner looks up one number, maybe twice.
  if (!(await allowRequest("loyalty-status", 15))) return null;
  if (!PHONE_RE.test(phone.trim())) return null;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(restaurantSlug);
  if (!restaurant || !restaurant.loyaltySettings.enabled) return null;

  const account = await store.getLoyaltyAccount(restaurant.id, phone.trim());
  return {
    enabled: true,
    punches: account?.points ?? 0,
    rewards: restaurant.loyaltySettings.rewards.map((r) => ({
      id: r.id,
      name: r.name,
      punchesNeeded: r.pointsCost,
      valueCents: r.valueCents,
    })),
  };
}

/**
 * Post-order "want deals?" prompt — never added to checkout itself so the
 * core ordering flow never gets slower. This is the one place a diner's
 * email and marketing SMS consent get captured; both are opt-in and
 * separate from the transactional smsOptIn already given at checkout.
 */
const FUNNEL_STEPS = new Set(["view", "add_to_cart", "checkout_start"]);

/**
 * Funnel beacon (Phase 8C). The client id is a random uuid in
 * localStorage; it's hashed server-side before storage so the events
 * table never holds a value that appears anywhere client-side. Fire and
 * forget — failures are invisible to diners by design.
 */
export async function recordFunnelEventAction(
  restaurantSlug: string,
  step: string,
  clientSessionId: string,
): Promise<void> {
  if (!FUNNEL_STEPS.has(step)) return;
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(clientSessionId)) return;
  if (!(await allowRequest("funnel-beacon", 60))) return;

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(restaurantSlug);
  if (!restaurant) return;

  const sessionHash = createHash("sha256")
    .update(`${restaurant.id}:${clientSessionId}`)
    .digest("hex")
    .slice(0, 24);
  await store.recordStorefrontEvent(restaurant.id, sessionHash, step as "view" | "add_to_cart" | "checkout_start");
}

export async function savePostOrderPreferencesAction(input: {
  restaurantSlug: string;
  phone: string;
  smsOptIn: boolean;
  email: string;
  emailOptIn: boolean;
  birthday: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await allowRequest("post-order-prefs", 5))) {
    return { ok: false, error: "Too many attempts — try again in a minute" };
  }
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(input.restaurantSlug);
  if (!restaurant) return { ok: false, error: "Not found" };

  const email = input.email.trim().slice(0, 120);
  if (input.emailOptIn && !EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email" };
  }

  if (input.smsOptIn || (input.emailOptIn && email)) {
    await store.setMarketingOptIn(restaurant.id, input.phone, {
      smsOptedIn: input.smsOptIn,
      emailOptedIn: input.emailOptIn && Boolean(email),
      email: email || undefined,
      source: "post_order",
    });
  }

  if (BIRTHDAY_RE.test(input.birthday)) {
    await store.setCustomerBirthday(restaurant.id, input.phone, input.birthday);
  }

  return { ok: true };
}
