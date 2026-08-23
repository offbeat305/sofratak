import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { finalizePaidOrder } from "@/lib/orders/place-order";
import { getStore } from "@/lib/db/store";
import type { SubscriptionTier } from "@/lib/db/types";
import {
  notifyPaymentFailed,
  notifyPaymentRecovered,
  sendCancellationExport,
} from "@/lib/billing/export";

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Two entirely separate event families land here:
 *  - Diner order payments (Connect, direct charges on the restaurant's
 *    connected account): checkout.session.completed w/ metadata.orderId.
 *  - Platform subscription billing (this restaurant paying Sofratak, on
 *    the platform's own account): checkout.session.completed w/
 *    metadata.restaurantId (no orderId), plus customer.subscription.* and
 *    invoice.* events. See lib/billing/.
 */
export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "webhooks not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const store = getStore();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === "paid") {
        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
        await finalizePaidOrder(orderId, session.id, origin);
        break;
      }
      // Subscription checkout: link the new subscription to the restaurant
      // right away so subsequent lifecycle events can find it by id.
      const restaurantId = session.metadata?.restaurantId;
      const tier = session.metadata?.tier as SubscriptionTier | undefined;
      if (restaurantId && session.mode === "subscription" && session.subscription) {
        await store.setBillingInfo(restaurantId, {
          stripeCustomerId: customerId(session.customer) ?? undefined,
          subscriptionId:
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          tier,
          status: "active",
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const restaurant = await store.getRestaurantBySubscriptionId(sub.id);
      if (!restaurant) break;
      const status =
        sub.status === "active" || sub.status === "trialing"
          ? "active"
          : sub.status === "past_due" || sub.status === "unpaid"
            ? "past_due"
            : restaurant.billing.status;
      await store.setBillingInfo(restaurant.id, { status });
      // Transitioning into "will cancel at period end" — honor the
      // sales-weapon promise immediately, not weeks later when the
      // subscription actually terminates. markCancelExportSent is
      // atomic, so this is safe to reach on every subsequent update too.
      if (sub.cancel_at_period_end) {
        await store.setBillingInfo(restaurant.id, {
          canceledAt: restaurant.billing.canceledAt ?? new Date().toISOString(),
        });
        await sendCancellationExport({ ...restaurant, billing: { ...restaurant.billing, status } });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const restaurant = await store.getRestaurantBySubscriptionId(sub.id);
      if (!restaurant) break;
      await store.setBillingInfo(restaurant.id, {
        status: "canceled",
        canceledAt: restaurant.billing.canceledAt ?? new Date().toISOString(),
      });
      // Fallback path (e.g. canceled directly in the Stripe dashboard,
      // skipping our "updated" branch above) — atomic guard, no duplicate.
      await sendCancellationExport({
        ...restaurant,
        billing: { ...restaurant.billing, status: "canceled" },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const id = customerId(invoice.customer);
      const restaurant = id ? await store.getRestaurantByCustomerId(id) : null;
      if (!restaurant) break;
      await store.setBillingInfo(restaurant.id, { status: "past_due" });
      await notifyPaymentFailed(restaurant);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const id = customerId(invoice.customer);
      const restaurant = id ? await store.getRestaurantByCustomerId(id) : null;
      if (!restaurant) break;
      const wasPastDue = restaurant.billing.status === "past_due";
      await store.setBillingInfo(restaurant.id, { status: "active" });
      if (wasPastDue) await notifyPaymentRecovered(restaurant);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
