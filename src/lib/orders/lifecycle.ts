import "server-only";
import { getStore } from "@/lib/db/store";
import { getSmsChannel } from "@/lib/sms";
import { sendOrderStatusPush } from "@/lib/push/expo";
import type { Order, OrderStatus, Restaurant } from "@/lib/db/types";

/** Kitchen-driven transitions. Diner-visible SMS goes out automatically. */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "canceled"],
  preparing: ["ready", "out_for_delivery", "canceled"],
  ready: ["completed"],
  out_for_delivery: ["completed"],
  completed: [],
  canceled: [],
};

function statusSms(order: Order, restaurant: Restaurant): string | null {
  const name = restaurant.name[order.locale];
  const bodies: Partial<Record<OrderStatus, { en: string; ar: string }>> = {
    preparing: {
      en: `${name}: order ${order.number} is being prepared.`,
      ar: `${name}: طلبك رقم ${order.number} قيد التحضير.`,
    },
    ready: {
      en: `${name}: order ${order.number} is ready for pickup!`,
      ar: `${name}: طلبك رقم ${order.number} جاهز للاستلام!`,
    },
    out_for_delivery: {
      en: `${name}: order ${order.number} is out for delivery.`,
      ar: `${name}: طلبك رقم ${order.number} في الطريق إليك.`,
    },
    canceled: {
      en: `${name}: order ${order.number} was canceled. You will be refunded.`,
      ar: `${name}: تم إلغاء طلبك رقم ${order.number}. سيتم رد المبلغ لك.`,
    },
  };
  return bodies[order.status]?.[order.locale] ?? null;
}

export async function advanceOrderStatus(
  orderId: string,
  to: OrderStatus,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (!ALLOWED[order.status].includes(to))
    return { ok: false, error: `Cannot go from ${order.status} to ${to}` };

  const updated = await store.updateOrderStatus(orderId, to);
  if (!updated) return { ok: false, error: "Order not found" };

  const restaurant = await store.getRestaurantById(updated.restaurantId);
  if (restaurant) {
    const body = statusSms(updated, restaurant);
    if (body) {
      await getSmsChannel().send({
        to: updated.customer.phone,
        body,
        orderId: updated.id,
      });
    }
    // Native-app orders also get a push (docs/mobile-app-spec.md §2) —
    // additive to SMS, never blocking: the sender swallows its own errors.
    await sendOrderStatusPush(updated, restaurant);
  }
  return { ok: true, order: updated };
}

/** Alert the owner once when an order sits unaccepted too long. */
export const UNACCEPTED_ALERT_MINUTES = 5;

export async function alertOverdueOrders(
  restaurant: Restaurant,
  origin: string,
): Promise<void> {
  const store = getStore();
  const orders = await store.listOrders(restaurant.id);
  const cutoff = Date.now() - UNACCEPTED_ALERT_MINUTES * 60_000;
  for (const order of orders) {
    if (
      order.status === "received" &&
      !order.unacceptedAlertSentAt &&
      new Date(order.createdAt).getTime() < cutoff
    ) {
      await store.markUnacceptedAlert(order.id);
      await getSmsChannel().send({
        to: restaurant.phone,
        body: `⚠ Order ${order.number} has NOT been accepted for ${UNACCEPTED_ALERT_MINUTES}+ minutes. Open the kitchen screen: ${origin}/en/kitchen/${restaurant.slug}`,
        orderId: order.id,
      });
    }
  }
}
