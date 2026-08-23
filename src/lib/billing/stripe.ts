import "server-only";
import Stripe from "stripe";
import { getStore } from "@/lib/db/store";
import type { Restaurant, SubscriptionTier } from "@/lib/db/types";
import { PLANS } from "./plans";

/**
 * Platform subscription billing — the restaurant paying SOFRATAK. Runs on
 * the platform's own Stripe account (no {stripeAccount} header), entirely
 * separate from lib/payments/ (diner→restaurant food money via Connect).
 */
function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

async function ensureCustomer(stripe: Stripe, restaurant: Restaurant): Promise<string> {
  if (restaurant.billing.stripeCustomerId) return restaurant.billing.stripeCustomerId;
  const customer = await stripe.customers.create({
    name: restaurant.name.en,
    phone: restaurant.phone || undefined,
    metadata: { restaurantId: restaurant.id, slug: restaurant.slug },
  });
  await getStore().setBillingInfo(restaurant.id, { stripeCustomerId: customer.id });
  return customer.id;
}

export async function startSubscriptionCheckout(
  restaurant: Restaurant,
  tier: SubscriptionTier,
  origin: string,
  locale: "en" | "ar",
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };
  try {
    const customerId = await ensureCustomer(stripe, restaurant);
    const plan = PLANS[tier];
    const returnUrl = `${origin}/${locale}/dashboard/${restaurant.slug}/settings/billing`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.priceCents,
            recurring: { interval: "month" },
            product_data: {
              name: `Sofratak ${plan.name}`,
              metadata: { tier },
            },
          },
        },
      ],
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=canceled`,
      subscription_data: {
        metadata: { restaurantId: restaurant.id, tier },
      },
      metadata: { restaurantId: restaurant.id, tier },
    });
    if (!session.url) return { ok: false, error: "Stripe session has no URL" };
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[billing] checkout failed", err);
    return { ok: false, error: "Could not start checkout" };
  }
}

export async function openBillingPortal(
  restaurant: Restaurant,
  returnUrl: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };
  if (!restaurant.billing.stripeCustomerId)
    return { ok: false, error: "No billing account yet" };
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: restaurant.billing.stripeCustomerId,
      return_url: returnUrl,
    });
    return { ok: true, url: session.url };
  } catch (err) {
    console.error("[billing] portal failed", err);
    return { ok: false, error: "Could not open billing portal" };
  }
}

/**
 * Cancel at period end — "month-to-month, no lock-in" (CLAUDE.md): the
 * restaurant already paid for the current period, so access continues
 * until it ends rather than an immediate cutoff/refund. The actual status
 * flip + cancellation data export happen in the webhook handler
 * (customer.subscription.deleted / updated with cancel_at) — single
 * source of truth, so a portal-initiated cancel gets the same treatment.
 */
export async function cancelSubscription(
  restaurant: Restaurant,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripe = stripeClient();
  if (!stripe) return { ok: false, error: "Stripe is not configured" };
  if (!restaurant.billing.subscriptionId)
    return { ok: false, error: "No active subscription" };
  try {
    await stripe.subscriptions.update(restaurant.billing.subscriptionId, {
      cancel_at_period_end: true,
    });
    await getStore().setBillingInfo(restaurant.id, {
      canceledAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    console.error("[billing] cancel failed", err);
    return { ok: false, error: "Could not cancel subscription" };
  }
}

/**
 * Poll Stripe and persist status/tier/period-end. Called when the billing
 * page loads (mirrors the proven Connect-onboarding-return pattern) so
 * local dev works end-to-end without live webhook delivery.
 */
export async function syncBillingStatus(restaurant: Restaurant): Promise<Restaurant> {
  const stripe = stripeClient();
  if (!stripe || !restaurant.billing.stripeCustomerId) return restaurant;
  try {
    const subs = await stripe.subscriptions.list({
      customer: restaurant.billing.stripeCustomerId,
      status: "all",
      limit: 1,
    });
    const sub = subs.data[0];
    if (!sub) return restaurant;

    const tier = (sub.metadata?.tier as SubscriptionTier | undefined) ?? restaurant.billing.tier;
    const status =
      sub.status === "active" || sub.status === "trialing"
        ? "active"
        : sub.status === "past_due" || sub.status === "unpaid"
          ? "past_due"
          : sub.status === "canceled"
            ? "canceled"
            : restaurant.billing.status;
    const periodEnd = new Date(sub.items.data[0].current_period_end * 1000).toISOString();

    const changed =
      restaurant.billing.subscriptionId !== sub.id ||
      restaurant.billing.status !== status ||
      restaurant.billing.tier !== tier;
    if (changed) {
      await getStore().setBillingInfo(restaurant.id, {
        subscriptionId: sub.id,
        tier,
        status,
        periodEnd,
      });
    }
    return {
      ...restaurant,
      billing: { ...restaurant.billing, subscriptionId: sub.id, tier, status, periodEnd },
    };
  } catch (err) {
    console.error("[billing] sync failed", err);
    return restaurant;
  }
}
