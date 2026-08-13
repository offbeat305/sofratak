import "server-only";
import { getStore } from "@/lib/db/store";
import { getPaymentProvider } from "@/lib/payments";
import { getSmsChannel } from "@/lib/sms";
import { formatCents } from "@/lib/money";
import type { Order } from "@/lib/db/types";

export function refundedSoFarCents(order: Order): number {
  return order.refunds.reduce((sum, r) => sum + r.amountCents, 0);
}

export type RefundRequest =
  | { kind: "full" }
  | { kind: "lines"; lines: Array<{ lineIndex: number; qty: number }> };

/**
 * Itemized refunds — full, or partial per line item (the thing Owner.com
 * can't do). Line refunds return the line's unit price × qty; full refunds
 * return everything remaining including fees and tip.
 */
export async function refundOrder(
  orderId: string,
  request: RefundRequest,
): Promise<{ ok: true; amountCents: number } | { ok: false; error: string }> {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.paymentStatus === "pending")
    return { ok: false, error: "Order was never paid" };

  const remaining = order.totalCents - refundedSoFarCents(order);
  if (remaining <= 0) return { ok: false, error: "Order is fully refunded" };

  let amountCents: number;
  let lines: Array<{ lineIndex: number; qty: number }> = [];

  if (request.kind === "full") {
    amountCents = remaining;
  } else {
    lines = request.lines.filter((l) => l.qty > 0);
    if (!lines.length) return { ok: false, error: "Nothing selected" };
    amountCents = 0;
    for (const { lineIndex, qty } of lines) {
      const line = order.lines[lineIndex];
      if (!line) return { ok: false, error: "Unknown line item" };
      const alreadyRefunded = order.refunds
        .flatMap((r) => r.lines)
        .filter((l) => l.lineIndex === lineIndex)
        .reduce((n, l) => n + l.qty, 0);
      if (qty > line.qty - alreadyRefunded)
        return { ok: false, error: `Only ${line.qty - alreadyRefunded}× left to refund on ${line.name.en}` };
      amountCents += line.unitPriceCents * qty;
    }
    amountCents = Math.min(amountCents, remaining);
  }

  // Orders paid through the mock provider (pre-Stripe dev data) refund
  // mock-style even when Stripe is configured.
  const payment = order.paymentRef.startsWith("mock_")
    ? { ok: true as const, ref: `mock_re_${order.paymentRef.slice(-8)}` }
    : await getPaymentProvider().refund({
        paymentRef: order.paymentRef,
        amountCents,
      });
  if (!payment.ok) return { ok: false, error: payment.error };

  const newStatus =
    amountCents >= remaining ? "refunded" : "partially_refunded";
  await store.addOrderRefund(
    orderId,
    {
      id: crypto.randomUUID(),
      amountCents,
      lines,
      ref: payment.ref,
      createdAt: new Date().toISOString(),
    },
    newStatus,
  );

  const restaurant = await store.getRestaurantById(order.restaurantId);
  if (restaurant) {
    const amount = formatCents(amountCents, order.locale);
    await getSmsChannel().send({
      to: order.customer.phone,
      body:
        order.locale === "ar"
          ? `${restaurant.name.ar}: تم رد ${amount} من طلبك رقم ${order.number}. قد يستغرق ظهوره في حسابك بضعة أيام.`
          : `${restaurant.name.en}: ${amount} from order ${order.number} was refunded. It may take a few days to appear on your statement.`,
      orderId: order.id,
    });
  }

  return { ok: true, amountCents };
}
