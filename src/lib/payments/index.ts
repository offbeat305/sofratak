import "server-only";

/**
 * Payment adapter. Real implementation: Stripe Connect — food revenue +
 * tip settle to the restaurant's connected account, the $0.79 service fee
 * routes to Sofratak, processing (2.9% + $0.30) passes through at cost.
 * Card data never touches our servers (Stripe Checkout/Elements only).
 */
export interface PaymentProvider {
  /** Charge for an order. Returns a payment reference to store on the order. */
  charge(input: {
    orderId: string;
    restaurantId: string;
    totalCents: number;
    serviceFeeCents: number;
    description: string;
  }): Promise<{ ok: true; ref: string } | { ok: false; error: string }>;
}

/** Auto-approves everything. Swapped for Stripe when keys exist (CLAUDE.md). */
class MockPaymentProvider implements PaymentProvider {
  async charge({ orderId }: { orderId: string }) {
    return { ok: true as const, ref: `mock_${orderId.slice(0, 8)}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Stripe provider not implemented yet — remove STRIPE_SECRET_KEY or implement src/lib/payments/stripe.ts (Stripe Connect, destination charges).",
    );
  }
  return new MockPaymentProvider();
}
