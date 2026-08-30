import "server-only";
import Stripe from "stripe";
import type { Order, Restaurant } from "@/lib/db/types";
import { SERVICE_FEE_CENTS } from "@/lib/fees";
import type { MobilePaymentStart, PaymentProvider, PaymentStart } from "./index";

/**
 * Hosted Stripe Checkout. Two modes:
 *
 * DIRECT CHARGES (restaurant onboarded via Connect, charges enabled): the
 * charge is created ON the restaurant's connected account — they are the
 * merchant of record and pay Stripe processing at cost (2.9% + 30¢), and
 * Sofratak collects exactly the $0.79 application fee. This matches the
 * business constants in CLAUDE.md.
 *
 * PLATFORM CHARGES (not yet onboarded — demo/dev): the charge lands on the
 * Sofratak account with no fee split.
 *
 * Either way the diner sees every line item — including "Service fee" —
 * card data never touches our servers, and finalization happens on the
 * status page (dev) or the signature-verified webhook (production).
 */
export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey);
  }

  /** Direct-charge routing applies only when onboarding is complete. */
  private accountFor(restaurant: Restaurant): string | undefined {
    return restaurant.stripe.chargesEnabled && restaurant.stripe.accountId
      ? restaurant.stripe.accountId
      : undefined;
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

    const account = this.accountFor(restaurant);
    const accountOpts = account ? { stripeAccount: account } : undefined;
    const statusUrl = `${origin}/${loc}/s/${restaurant.slug}/order/${order.id}`;
    try {
      // Offer-code / loyalty-reward discount: Checkout line items can't be
      // negative, so the discount rides as a one-time amount_off coupon —
      // created on the same account as the session (connected account for
      // direct charges). The diner sees it as a proper discount line.
      let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
      if (order.discountCents > 0) {
        const coupon = await this.stripe.coupons.create(
          {
            amount_off: order.discountCents,
            currency: "usd",
            duration: "once",
            name: order.offerCode
              ? loc === "ar"
                ? `خصم (${order.offerCode})`
                : `Discount (${order.offerCode})`
              : loc === "ar"
                ? "مكافأة الولاء"
                : "Loyalty reward",
          },
          accountOpts,
        );
        discounts = [{ coupon: coupon.id }];
      }

      const session = await this.stripe.checkout.sessions.create(
        {
          mode: "payment",
          locale: loc === "ar" ? "auto" : loc, // Stripe has no ar locale yet
          line_items: lineItems,
          ...(discounts && { discounts }),
          success_url: `${statusUrl}?new=1&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/${loc}/s/${restaurant.slug}/checkout?canceled=1`,
          metadata: {
            orderId: order.id,
            restaurantId: order.restaurantId,
            serviceFeeCents: String(order.serviceFeeCents),
          },
          ...(account && {
            payment_intent_data: {
              application_fee_amount: SERVICE_FEE_CENTS,
            },
          }),
        },
        accountOpts,
      );
      if (!session.url) return { kind: "error", error: "Stripe session has no URL" };
      // Hard invariant: what Stripe will charge must equal what the order
      // recorded — the diner must never pay a cent more or less than the
      // total shown at checkout. Fail closed rather than mischarge.
      if (session.amount_total !== order.totalCents) {
        console.error(
          `[stripe] session total ${session.amount_total} != order total ${order.totalCents} for ${order.id} — refusing to start payment`,
        );
        return { kind: "error", error: "Payment could not be started" };
      }
      return { kind: "redirect", url: session.url, ref: session.id };
    } catch (err) {
      console.error("[stripe] checkout session failed", err);
      return { kind: "error", error: "Payment could not be started" };
    }
  }

  /**
   * Native-app path (docs/mobile-app-spec.md §4): one PaymentIntent for
   * order.totalCents, confirmed in-app by PaymentSheet. No line items
   * exist at this layer (the app renders its own receipt), so discounts
   * need no coupon dance — the total already has them subtracted. Money
   * movement is identical to web: direct charge on the connected account
   * when onboarded, $0.79 application fee to Sofratak.
   */
  async startMobilePayment({
    order,
    restaurant,
  }: {
    order: Order;
    restaurant: Restaurant;
  }): Promise<MobilePaymentStart> {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error("[stripe] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing — mobile payment unavailable");
      return { kind: "error", error: "Payment could not be started" };
    }
    const account = this.accountFor(restaurant);
    try {
      const intent = await this.stripe.paymentIntents.create(
        {
          amount: order.totalCents,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          description: `Order ${order.number} — ${restaurant.name.en}`,
          metadata: {
            orderId: order.id,
            restaurantId: order.restaurantId,
            serviceFeeCents: String(order.serviceFeeCents),
            channel: "mobile_app",
          },
          ...(account && { application_fee_amount: SERVICE_FEE_CENTS }),
        },
        account ? { stripeAccount: account } : undefined,
      );
      if (!intent.client_secret) {
        return { kind: "error", error: "Payment could not be started" };
      }
      return {
        kind: "payment_intent",
        clientSecret: intent.client_secret,
        ref: intent.id,
        stripeAccountId: account ?? null,
        publishableKey,
      };
    } catch (err) {
      console.error("[stripe] payment intent failed", err);
      return { kind: "error", error: "Payment could not be started" };
    }
  }

  async verifyPayment(ref: string, restaurant: Restaurant): Promise<boolean> {
    const account = this.accountFor(restaurant);
    const opts = account ? { stripeAccount: account } : undefined;
    // Mobile orders hold a PaymentIntent ref; web orders a Checkout session.
    if (ref.startsWith("pi_")) {
      try {
        const intent = await this.stripe.paymentIntents.retrieve(ref, undefined, opts);
        return intent.status === "succeeded";
      } catch {
        return false;
      }
    }
    if (!ref.startsWith("cs_")) return false;
    try {
      const session = await this.stripe.checkout.sessions.retrieve(ref, undefined, opts);
      return session.payment_status === "paid";
    } catch {
      return false;
    }
  }

  async refund({
    paymentRef,
    amountCents,
    restaurant,
  }: {
    paymentRef: string;
    amountCents: number;
    restaurant: Restaurant;
  }): Promise<{ ok: true; ref: string } | { ok: false; error: string }> {
    const account = this.accountFor(restaurant);
    const opts = account ? { stripeAccount: account } : undefined;
    try {
      // Mobile orders store the PaymentIntent id directly; web orders
      // store a Checkout session that must be unwrapped to its intent.
      let paymentIntent: string | undefined;
      if (paymentRef.startsWith("pi_")) {
        paymentIntent = paymentRef;
      } else {
        const session = await this.stripe.checkout.sessions.retrieve(paymentRef, undefined, opts);
        paymentIntent =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
      }
      if (!paymentIntent)
        return { ok: false, error: "No payment found for this order" };
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: paymentIntent,
          amount: amountCents,
          // On direct charges, claw back the proportional application fee
          // so the restaurant isn't out of pocket for Sofratak's share.
          ...(account && { refund_application_fee: true }),
        },
        opts,
      );
      return { ok: true, ref: refund.id };
    } catch (err) {
      console.error("[stripe] refund failed", err);
      return { ok: false, error: "Refund could not be processed" };
    }
  }
}
