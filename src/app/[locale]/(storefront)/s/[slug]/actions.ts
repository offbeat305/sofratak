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
