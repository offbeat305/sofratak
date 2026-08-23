"use server";

import { headers } from "next/headers";
import {
  placeOrder,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "@/lib/orders/place-order";
import { getStore } from "@/lib/db/store";

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
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
export async function savePostOrderPreferencesAction(input: {
  restaurantSlug: string;
  phone: string;
  smsOptIn: boolean;
  email: string;
  emailOptIn: boolean;
  birthday: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
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
