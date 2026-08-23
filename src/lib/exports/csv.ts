import "server-only";
import type { Order } from "@/lib/db/types";
import { customersFromOrders, toCsv, type Customer } from "@/lib/crm/customers";

/**
 * Shared CSV builders — used by the dashboard export buttons AND the
 * automatic cancellation export (lib/billing/export.ts), so the two
 * paths can never drift apart. "Every list exportable to CSV" is a sales
 * promise (CLAUDE.md); this is the one place that promise is kept.
 */
export function ordersToCsv(orders: Order[]): string {
  return toCsv(
    orders.map((o) => ({
      number: o.number,
      created_at: o.createdAt,
      status: o.status,
      payment_status: o.paymentStatus,
      fulfillment: o.fulfillment,
      customer_name: o.customer.name,
      customer_phone: o.customer.phone,
      items: o.lines.map((l) => `${l.qty}x ${l.name.en}`).join("; "),
      subtotal_usd: (o.subtotalCents / 100).toFixed(2),
      service_fee_usd: (o.serviceFeeCents / 100).toFixed(2),
      delivery_fee_usd: (o.deliveryFeeCents / 100).toFixed(2),
      tip_usd: (o.tipCents / 100).toFixed(2),
      total_usd: (o.totalCents / 100).toFixed(2),
      refunded_usd: (o.refunds.reduce((n, r) => n + r.amountCents, 0) / 100).toFixed(2),
    })),
  );
}

export function customersToCsv(customers: Customer[]): string {
  return toCsv(
    customers.map((c) => ({
      name: c.name,
      phone: c.phone,
      orders: c.orderCount,
      total_spent_usd: (c.totalSpentCents / 100).toFixed(2),
      last_order: c.lastOrderAt,
      sms_opt_in: c.smsOptIn ? "yes" : "no",
      tags: c.tags.join("|"),
    })),
  );
}

export function customersFromOrdersCsv(orders: Order[]): string {
  return customersToCsv(customersFromOrders(orders));
}
