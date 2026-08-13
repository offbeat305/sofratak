import "server-only";
import Stripe from "stripe";
import { getStore } from "@/lib/db/store";
import type { Restaurant } from "@/lib/db/types";

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

/**
 * Create (or reuse) the restaurant's Express account and return a fresh
 * onboarding link. Safe to call repeatedly — Stripe resumes onboarding.
 */
export async function startConnectOnboarding(
  restaurant: Restaurant,
  returnUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };

  try {
    let accountId = restaurant.stripe.accountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: undefined,
        business_profile: { name: restaurant.name.en },
        metadata: { restaurantId: restaurant.id },
      });
      accountId = account.id;
      await getStore().setStripeAccount(restaurant.id, accountId, false);
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: returnUrl,
      return_url: returnUrl,
    });
    return { ok: true, url: link.url };
  } catch (err) {
    console.error("[stripe-connect] onboarding failed", err);
    return { ok: false, error: "Could not start Stripe onboarding" };
  }
}

/**
 * Poll the account and persist charges_enabled. Called when the settings
 * page loads so returning from Stripe onboarding flips the flag without
 * needing Connect webhooks in dev.
 */
export async function syncConnectStatus(restaurant: Restaurant): Promise<boolean> {
  const stripe = stripeClient();
  if (!stripe || !restaurant.stripe.accountId) return false;
  try {
    const account = await stripe.accounts.retrieve(restaurant.stripe.accountId);
    const enabled = Boolean(account.charges_enabled);
    if (enabled !== restaurant.stripe.chargesEnabled) {
      await getStore().setStripeAccount(
        restaurant.id,
        restaurant.stripe.accountId,
        enabled,
      );
    }
    return enabled;
  } catch {
    return restaurant.stripe.chargesEnabled;
  }
}
