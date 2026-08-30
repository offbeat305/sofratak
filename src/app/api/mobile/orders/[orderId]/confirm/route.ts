import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getPaymentProvider } from "@/lib/payments";
import { finalizePaidOrder } from "@/lib/orders/place-order";
import { orderPublicView, requestOrigin } from "@/lib/mobile/api";
import { allowRequest } from "@/lib/rate-limit";

/**
 * Called by the app right after PaymentSheet reports success. The app's
 * word is never the source of truth: we re-verify the PaymentIntent with
 * Stripe server-side, then run the same idempotent finalizePaidOrder the
 * web status page and webhook use. The payment_intent.succeeded webhook
 * covers the case where the app dies before making this call.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!(await allowRequest("mobile-order-confirm", 15))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { orderId } = await params;
  const store = getStore();
  let order = await store.getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.paymentStatus === "pending") {
    const restaurant = await store.getRestaurantById(order.restaurantId);
    if (!restaurant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Mock mode finalizes at placement, so a pending order here always has
    // a real PaymentIntent ref to verify.
    const ref = order.paymentRef;
    if (ref && (await getPaymentProvider().verifyPayment(ref, restaurant))) {
      order =
        (await finalizePaidOrder(orderId, ref, requestOrigin(request))) ??
        (await store.getOrder(orderId)) ??
        order;
    }
  }

  return NextResponse.json({
    order: orderPublicView(order),
    paid: order.paymentStatus !== "pending",
  });
}
