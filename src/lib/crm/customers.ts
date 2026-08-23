import "server-only";
import { getStore } from "@/lib/db/store";
import type { Order } from "@/lib/db/types";

export type Customer = {
  name: string;
  phone: string;
  orderCount: number;
  totalSpentCents: number;
  lastOrderAt: string;
  smsOptIn: boolean;
  tags: Array<"vip" | "lapsed" | "new">;
};

const VIP_MIN_ORDERS = 5;
const VIP_MIN_SPEND_CENTS = 15_000;
export const LAPSED_DAYS = 30;

/**
 * The customer book is auto-built from paid orders — no separate table to
 * maintain, nothing for the owner to enter. Keyed by phone number.
 */
export function customersFromOrders(orders: Order[]): Customer[] {
  const byPhone = new Map<string, Customer>();
  for (const order of orders) {
    if (order.paymentStatus === "pending") continue;
    const key = order.customer.phone.replace(/\D/g, "");
    const existing = byPhone.get(key);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpentCents += order.totalCents;
      if (order.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt;
        existing.name = order.customer.name;
      }
      existing.smsOptIn = existing.smsOptIn || order.customer.smsOptIn;
    } else {
      byPhone.set(key, {
        name: order.customer.name,
        phone: order.customer.phone,
        orderCount: 1,
        totalSpentCents: order.totalCents,
        lastOrderAt: order.createdAt,
        smsOptIn: order.customer.smsOptIn,
        tags: [],
      });
    }
  }

  const now = Date.now();
  const customers = [...byPhone.values()];
  for (const c of customers) {
    const daysSince = (now - new Date(c.lastOrderAt).getTime()) / 86_400_000;
    if (c.orderCount >= VIP_MIN_ORDERS || c.totalSpentCents >= VIP_MIN_SPEND_CENTS)
      c.tags.push("vip");
    if (daysSince > LAPSED_DAYS) c.tags.push("lapsed");
    if (c.orderCount === 1 && daysSince <= 7) c.tags.push("new");
  }
  return customers.sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt));
}

export async function customersForRestaurant(
  restaurantId: string,
): Promise<Customer[]> {
  const orders = await getStore().listOrders(restaurantId);
  return customersFromOrders(orders);
}

/** Campaign audience: "all" (with a phone/email at all) or one CRM tag. */
export function customersBySegment(
  customers: Customer[],
  segment: "all" | "vip" | "lapsed" | "new",
): Customer[] {
  return segment === "all" ? customers : customers.filter((c) => c.tags.includes(segment));
}

/** CSV export is a one-click sales promise (CLAUDE.md) — keep it trivial. */
export function toCsv(rows: Array<Record<string, string | number>>): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}
