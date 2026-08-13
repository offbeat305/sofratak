import "server-only";
import Stripe from "stripe";
import type { Order, Restaurant } from "@/lib/db/types";
import type { PaymentProvider, PaymentStart } from "./index";

/**
 * Hosted Stripe Checkout. The diner sees every line item — including the
 * $0.79 "Service fee" as its own line (business requirement) — pays on
 * Stripe's page, and lands back on the order status page, which verifies
 * the session and finalizes the order. checkout.session.completed webhook
 * does the same in production (src/app/api/webhooks/stripe/route.ts).
 */
export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  async startPayment({
    order,
    restaurant,
    origin,
  }: {
    order: Order;
    restaurant: Restaurant;
    origin: string;
  }): Promise<PaymentStart> {
    const loc = order.locale;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.lines.map((line) => ({
        quantity: line.qty,
        price_data: {
          currency: "usd",
          unit_amount: line.unitPriceCents,
          product_data: {
            name: line.name[loc],
            ...(line.modifiers.length > 0 && {
              description: line.modifiers
                .map((m) => m.optionName[loc])
                .join(" · "),
            }),
          },
        },
      }));

    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: order.serviceFeeCents,
        product_data: { name: loc === "ar" ? "رسوم الخدمة" : "Service fee" },
      },
    });
    if (order.deliveryFeeCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: order.deliveryFeeCents,
          product_data: { name: loc === "ar" ? "رسوم التوصيل" : "Delivery fee" },
        },
      });
    }
    if (order.tipCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: order.tipCents,
          product_data: { name: loc === "ar" ? "بقشيش" : "Tip" },
        },
      });
    }

    const statusUrl = `${origin}/${loc}/s/${restaurant.slug}/order/${order.id}`;
    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: "payment",
        locale: loc === "ar" ? "auto" : loc, // Stripe has no ar locale yet
        line_items: lineItems,
        success_url: `${statusUrl}?new=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/${loc}/s/${restaurant.slug}/checkout?canceled=1`,
        metadata: {
          orderId: order.id,
          restaurantId: order.restaurantId,
          serviceFeeCents: String(order.serviceFeeCents),
        },
        // TODO Phase 4 (Stripe Connect): transfer_data.destination to the
        // restaurant's connected account + application_fee_amount = $0.79.
      });
      if (!session.url) return { kind: "error", error: "Stripe session has no URL" };
      return { kind: "redirect", url: session.url, ref: session.id };
    } catch (err) {
      console.error("[stripe] checkout session failed", err);
      return { kind: "error", error: "Payment could not be started" };
    }
  }

  async verifyPayment(ref: string): Promise<boolean> {
    if (!ref.startsWith("cs_")) return false;
    try {
      const session = await this.stripe.checkout.sessions.retrieve(ref);
      return session.payment_status === "paid";
    } catch {
      return false;
    }
  }

  async refund({
    paymentRef,
    amountCents,
  }: {
    paymentRef: string;
    amountCents: number;
  }): Promise<{ ok: true; ref: string } | { ok: false; error: string }> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(paymentRef);
      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!paymentIntent)
        return { ok: false, error: "No payment found for this order" };
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntent,
        amount: amountCents,
      });
      return { ok: true, ref: refund.id };
    } catch (err) {
      console.error("[stripe] refund failed", err);
      return { ok: false, error: "Refund could not be processed" };
    }
  }
}
