import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { finalizePaidOrder } from "@/lib/orders/place-order";

/**
 * Production path for payment finalization (the order status page also
 * verifies on redirect, so local dev works without webhooks). Signature
 * verification is mandatory — configure STRIPE_WEBHOOK_SECRET from
 * dashboard.stripe.com → Developers → Webhooks.
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId && session.payment_status === "paid") {
      const origin =
        process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
      await finalizePaidOrder(orderId, session.id, origin);
    }
  }

  return NextResponse.json({ received: true });
}
