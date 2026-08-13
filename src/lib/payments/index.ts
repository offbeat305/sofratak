import "server-only";
import type { Order, Restaurant } from "@/lib/db/types";
import { StripePaymentProvider } from "./stripe";

/**
 * Payment adapter. Stripe: hosted Checkout (card data never touches our
 * servers), standard 2.9% + 30¢ self-handled pricing. Stripe Connect
 * (food revenue + tips to the restaurant's connected account, $0.79 to
 * Sofratak) arrives with Phase 4 onboarding. Stripe Tax before first live
 * order (FL prepared food taxable; Hillsborough 7.5%, MI 6%).
 */
export type PaymentStart =
  | { kind: "paid"; ref: string }
  | { kind: "redirect"; url: string; ref: string }
  | { kind: "error"; error: string };

export interface PaymentProvider {
  /** Begin payment for a priced, stored order. */
  startPayment(input: {
    order: Order;
    restaurant: Restaurant;
    origin: string;
  }): Promise<PaymentStart>;
  /**
   * True if the referenced payment is settled (idempotent check).
   * Direct charges live on the restaurant's connected account, so the
   * restaurant context is required to find them.
   */
  verifyPayment(ref: string, restaurant: Restaurant): Promise<boolean>;
  /** Refund part or all of a settled payment. */
  refund(input: {
    paymentRef: string;
    amountCents: number;
    restaurant: Restaurant;
  }): Promise<{ ok: true; ref: string } | { ok: false; error: string }>;
}

/** Auto-approves everything. Active only when no STRIPE_SECRET_KEY is set. */
class MockPaymentProvider implements PaymentProvider {
  async startPayment({ order }: { order: Order }): Promise<PaymentStart> {
    return { kind: "paid", ref: `mock_${order.id.slice(0, 8)}` };
  }
  async verifyPayment(): Promise<boolean> {
    return true;
  }
  async refund({ paymentRef }: { paymentRef: string; amountCents: number; restaurant: Restaurant }) {
    return { ok: true as const, ref: `mock_re_${paymentRef.slice(-8)}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentProvider(process.env.STRIPE_SECRET_KEY);
  }
  return new MockPaymentProvider();
}
