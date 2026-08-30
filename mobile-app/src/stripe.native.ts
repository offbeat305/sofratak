import type { Locale } from "./types";

/**
 * Stripe isolation layer. @stripe/stripe-react-native is a native module
 * that does not exist inside Expo Go — a top-level import would crash the
 * whole bundle there. Everything goes through this lazy accessor instead:
 * in Expo Go (or if the module is missing for any reason) presentPayment
 * reports "unavailable" and the checkout screen shows a clear error. In a
 * dev build / production build the real PaymentSheet runs.
 *
 * Against the local dev server with no STRIPE_SECRET_KEY, the API returns
 * payment:null (mock auto-paid) and this module is never invoked — which
 * is what makes the full flow testable in Expo Go.
 */

export type PaymentSheetResult =
  | { status: "paid" }
  | { status: "canceled" }
  | { status: "failed"; message: string }
  | { status: "unavailable" };

type StripeModule = typeof import("@stripe/stripe-react-native");

let stripeModule: StripeModule | null | undefined;

function loadStripe(): StripeModule | null {
  if (stripeModule !== undefined) return stripeModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    stripeModule = require("@stripe/stripe-react-native") as StripeModule;
  } catch {
    stripeModule = null;
  }
  return stripeModule;
}

export async function presentPaymentSheet(input: {
  clientSecret: string;
  publishableKey: string;
  stripeAccountId: string | null;
  merchantName: string;
  locale: Locale;
}): Promise<PaymentSheetResult> {
  const stripe = loadStripe();
  if (!stripe) return { status: "unavailable" };

  try {
    await stripe.initStripe({
      publishableKey: input.publishableKey,
      stripeAccountId: input.stripeAccountId ?? undefined,
      merchantIdentifier: "merchant.com.sofratak.app",
    });

    const init = await stripe.initPaymentSheet({
      paymentIntentClientSecret: input.clientSecret,
      merchantDisplayName: input.merchantName,
      // PaymentSheet follows the device locale for its own chrome; card
      // networks/Apple Pay/Google Pay availability comes from the intent.
      defaultBillingDetails: {},
    });
    if (init.error) return { status: "failed", message: init.error.message };

    const result = await stripe.presentPaymentSheet();
    if (result.error) {
      if (result.error.code === "Canceled") return { status: "canceled" };
      return { status: "failed", message: result.error.message };
    }
    return { status: "paid" };
  } catch (err) {
    return { status: "failed", message: err instanceof Error ? err.message : "Payment failed" };
  }
}
