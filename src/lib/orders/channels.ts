import "server-only";
import type { Order, Restaurant } from "@/lib/db/types";
import { getSmsChannel } from "@/lib/sms";
import { getOtterClient } from "@/lib/integrations/otter";

/**
 * OrderChannel adapter (business requirement): every way an order reaches
 * the kitchen. v1 default is the kitchen web view; SMS ticket is the
 * fallback for owners who won't keep a browser open; Otter is stubbed
 * until partner API access lands.
 */
export interface OrderChannel {
  readonly id: "kitchen_view" | "sms_ticket" | "otter";
  notifyNewOrder(order: Order, restaurant: Restaurant, origin: string): Promise<void>;
}

/** The kitchen page pulls live orders itself; nothing to push. */
class KitchenViewChannel implements OrderChannel {
  readonly id = "kitchen_view" as const;
  async notifyNewOrder() {}
}

/** SMS to the restaurant phone with a link to the printable ticket. */
class SmsTicketChannel implements OrderChannel {
  readonly id = "sms_ticket" as const;
  async notifyNewOrder(order: Order, restaurant: Restaurant, origin: string) {
    await getSmsChannel().send({
      to: restaurant.phone,
      body: `New order ${order.number} (${order.fulfillment}) — ${order.lines.reduce((n, l) => n + l.qty, 0)} items. Ticket: ${origin}/en/kitchen/${restaurant.slug}/ticket/${order.id}`,
      orderId: order.id,
    });
  }
}

class OtterChannel implements OrderChannel {
  readonly id = "otter" as const;
  async notifyNewOrder(order: Order, restaurant: Restaurant) {
    await getOtterClient().submitOrder(order, restaurant);
  }
}

/**
 * Which channels a restaurant uses will become a per-tenant setting in the
 * Phase 4 dashboard; until then every restaurant gets the v1 default set.
 */
export function channelsFor(): OrderChannel[] {
  return [new KitchenViewChannel(), new SmsTicketChannel(), new OtterChannel()];
}

export async function dispatchNewOrder(
  order: Order,
  restaurant: Restaurant,
  origin: string,
): Promise<void> {
  // Channels must never block or fail an already-paid order.
  await Promise.allSettled(
    channelsFor().map((c) =>
      c.notifyNewOrder(order, restaurant, origin).catch((err) => {
        console.error(`[order-channel:${c.id}] failed for ${order.number}`, err);
      }),
    ),
  );
}
