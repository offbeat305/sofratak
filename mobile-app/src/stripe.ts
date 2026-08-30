import type { Locale } from "./types";

/**
 * Web stub for the Stripe module. Metro picks stripe.native.ts on
 * iOS/Android (real PaymentSheet) and this file on web, where the native
 * module can't exist — the web target is a dev smoke-test surface only,
 * and there the API's mock mode (payment:null) skips payment entirely.
 * Keep both files' exports identical.
 */

export type PaymentSheetResult =
  | { status: "paid" }
  | { status: "canceled" }
  | { status: "failed"; message: string }
  | { status: "unavailable" };

export async function presentPaymentSheet(_input: {
  clientSecret: string;
  publishableKey: string;
  stripeAccountId: string | null;
  merchantName: string;
  locale: Locale;
}): Promise<PaymentSheetResult> {
  return { status: "unavailable" };
}
