import type { Order } from "@/lib/db/types";

/**
 * Shared stats math (extracted from the Today dashboard so the weekly
 * report can never disagree with what the owner sees there).
 */

/** Calendar day number in the restaurant's timezone (not the server's). */
export function dayNumber(date: string | Date, timeZone: string): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(date))
    .split("-")
    .map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * The restaurant's take: subtotal + tip + delivery fee. The $0.79 service
 * fee is Sofratak's, so it never counts as restaurant revenue. Refunds are
 * subtracted (clamped at 0 — a full refund includes the fee).
 */
export function netCents(order: Order): number {
  if (order.paymentStatus === "pending") return 0;
  const take = order.totalCents - order.serviceFeeCents;
  const refunded = order.refunds.reduce((n, r) => n + r.amountCents, 0);
  return Math.max(0, take - refunded);
}
