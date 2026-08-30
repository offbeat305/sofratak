import "server-only";
import type { Order, OrderStatus, Restaurant } from "@/lib/db/types";

/**
 * Order-status push for the native diner app (docs/mobile-app-spec.md §2).
 * Talks straight to Expo's push HTTP API — no SDK dependency for one POST.
 * Strictly additive to SMS: every send here is fire-and-forget and must
 * never block or fail an order operation, same contract as the SMS/loyalty
 * side effects in finalizePaidOrder.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** Expo tokens look like ExponentPushToken[xxxx] or ExpoPushToken[xxxx]. */
export function isExpoPushToken(token: string): boolean {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

function pushBody(
  order: Order,
  restaurant: Restaurant,
): { title: string; body: string } | null {
  const name = restaurant.name[order.locale];
  const bodies: Partial<Record<OrderStatus, { en: string; ar: string }>> = {
    preparing: {
      en: `Order ${order.number} is being prepared.`,
      ar: `طلبك رقم ${order.number} قيد التحضير.`,
    },
    ready: {
      en: `Order ${order.number} is ready for pickup!`,
      ar: `طلبك رقم ${order.number} جاهز للاستلام!`,
    },
    out_for_delivery: {
      en: `Order ${order.number} is out for delivery.`,
      ar: `طلبك رقم ${order.number} في الطريق إليك.`,
    },
    completed: {
      en: `Order ${order.number} is complete. Thank you!`,
      ar: `اكتمل طلبك رقم ${order.number}. شكرًا لك!`,
    },
    canceled: {
      en: `Order ${order.number} was canceled. You will be refunded.`,
      ar: `تم إلغاء طلبك رقم ${order.number}. سيتم رد المبلغ لك.`,
    },
  };
  const body = bodies[order.status]?.[order.locale];
  return body ? { title: name, body } : null;
}

/** Confirmation push right after payment lands (mirrors the confirmation SMS). */
export async function sendOrderConfirmationPush(
  order: Order,
  restaurant: Restaurant,
): Promise<void> {
  if (!order.pushToken) return;
  const title = restaurant.name[order.locale];
  const body =
    order.locale === "ar"
      ? `استلمنا طلبك رقم ${order.number}. سنعلمك أول بأول.`
      : `We received order ${order.number}. We'll keep you posted.`;
  await send(order, { title, body });
}

/** Status-change push (accepted/preparing/ready/out-for-delivery/canceled). */
export async function sendOrderStatusPush(
  order: Order,
  restaurant: Restaurant,
): Promise<void> {
  if (!order.pushToken) return;
  const message = pushBody(order, restaurant);
  if (!message) return;
  await send(order, message);
}

async function send(order: Order, message: { title: string; body: string }): Promise<void> {
  if (!order.pushToken || !isExpoPushToken(order.pushToken)) return;
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: order.pushToken,
        title: message.title,
        body: message.body,
        sound: "default",
        data: { orderId: order.id, status: order.status },
      }),
    });
    if (!res.ok) {
      console.error(`[push] expo returned ${res.status} for order ${order.id}`);
    }
  } catch (err) {
    console.error("[push] send failed", err);
  }
}
