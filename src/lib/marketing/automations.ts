import "server-only";
import { getStore } from "@/lib/db/store";
import { getSmsChannel } from "@/lib/sms";
import { customersFromOrders } from "@/lib/crm/customers";
import { withinSmsQuietHours } from "./compliance";
import type { Order, Restaurant } from "@/lib/db/types";

const monthKey = (d = new Date()) => d.toISOString().slice(0, 7); // YYYY-MM
const yearKey = (d = new Date()) => d.toISOString().slice(0, 4);
const monthDay = (d = new Date()) => d.toISOString().slice(5, 10); // MM-DD

async function isSmsOptedIn(restaurantId: string, phone: string): Promise<boolean> {
  const optIn = await getStore().getMarketingOptIn(restaurantId, phone);
  return Boolean(optIn?.smsOptedIn);
}

/**
 * All four kinds are gated on the same marketing SMS opt-in as manual
 * campaigns — "automated" doesn't mean "consent doesn't apply." Each
 * send is guarded by tryRecordAutomation's atomic (kind, phone, ref)
 * uniqueness, so a daily cron re-run never double-sends.
 */
export async function runAutomationsForRestaurant(restaurant: Restaurant): Promise<{ sent: number }> {
  if (!withinSmsQuietHours(restaurant.timezone)) return { sent: 0 };

  const store = getStore();
  const orders = await store.listOrders(restaurant.id);
  let sent = 0;

  if (restaurant.automations.welcome) {
    const firstOrderByPhone = new Map<string, Order>();
    for (const o of orders) {
      if (o.paymentStatus === "pending") continue;
      const key = o.customer.phone.replace(/\D/g, "");
      const existing = firstOrderByPhone.get(key);
      if (!existing || o.createdAt < existing.createdAt) firstOrderByPhone.set(key, o);
    }
    for (const order of firstOrderByPhone.values()) {
      if (!(await isSmsOptedIn(restaurant.id, order.customer.phone))) continue;
      if (!(await store.tryRecordAutomation(restaurant.id, "welcome", order.customer.phone, order.id)))
        continue;
      const body =
        order.locale === "ar"
          ? `أهلاً بك في ${restaurant.name.ar}! شكرًا لطلبك الأول — نتمنى نشوفك مرة ثانية قريبًا.`
          : `Welcome to ${restaurant.name.en}! Thanks for your first order — hope to see you again soon.`;
      await getSmsChannel().send({ to: order.customer.phone, body });
      sent++;
    }
  }

  if (restaurant.automations.winBack) {
    const lapsed = customersFromOrders(orders).filter((c) => c.tags.includes("lapsed"));
    for (const c of lapsed) {
      if (!(await isSmsOptedIn(restaurant.id, c.phone))) continue;
      if (!(await store.tryRecordAutomation(restaurant.id, "win_back", c.phone, monthKey()))) continue;
      const body = `${restaurant.name.en}: We miss you! Come back and order again — we'd love to see you.`;
      await getSmsChannel().send({ to: c.phone, body });
      sent++;
    }
  }

  if (restaurant.automations.reviewRequest && restaurant.googleReviewsUrl) {
    const twoHoursAgo = Date.now() - 2 * 3600_000;
    const completed = orders.filter(
      (o) => o.status === "completed" && new Date(o.updatedAt).getTime() < twoHoursAgo,
    );
    for (const order of completed) {
      if (!(await isSmsOptedIn(restaurant.id, order.customer.phone))) continue;
      if (
        !(await store.tryRecordAutomation(restaurant.id, "review_request", order.customer.phone, order.id))
      )
        continue;
      const body =
        order.locale === "ar"
          ? `شكرًا لطلبك من ${restaurant.name.ar}! إذا عجبك الأكل، بتسعدنا مراجعتك: ${restaurant.googleReviewsUrl}`
          : `Thanks for ordering from ${restaurant.name.en}! If you enjoyed it, we'd love a review: ${restaurant.googleReviewsUrl}`;
      await getSmsChannel().send({ to: order.customer.phone, body });
      sent++;
    }
  }

  if (restaurant.automations.birthday) {
    const profiles = await store.listBirthdaysToday(restaurant.id, monthDay());
    for (const profile of profiles) {
      if (!(await isSmsOptedIn(restaurant.id, profile.phone))) continue;
      if (!(await store.tryRecordAutomation(restaurant.id, "birthday", profile.phone, yearKey()))) continue;
      const body = `${restaurant.name.en}: Happy birthday from all of us! Come treat yourself today.`;
      await getSmsChannel().send({ to: profile.phone, body });
      sent++;
    }
  }

  return { sent };
}
