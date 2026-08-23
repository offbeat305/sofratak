import "server-only";
import { getStore } from "@/lib/db/store";
import { getEmailChannel } from "@/lib/email";
import { getSmsChannel } from "@/lib/sms";
import { customersFromOrders } from "@/lib/crm/customers";
import {
  computeWeeklyStats,
  money,
  renderWeeklyEmail,
  type SuggestedAction,
} from "./weekly-stats";
import type { Order, Restaurant } from "@/lib/db/types";

/**
 * Phase 6: the weekly Monday owner report (CLAUDE.md) — orders/revenue/
 * avg ticket vs prior week, new vs returning, best sellers, estimated
 * savings vs a 25% marketplace rate (always "estimated", never
 * "guaranteed"), one suggested action with a deep link. EN + AR in one
 * short email; SMS nudge with a dashboard link. Pure math + rendering
 * live in weekly-stats.ts.
 */

export function suggestAction(restaurant: Restaurant, orders: Order[]): SuggestedAction {
  const slug = restaurant.slug;
  if (restaurant.ordering.paused) {
    return {
      en: "Ordering is paused — resume it so diners can order again.",
      ar: "الطلبات متوقفة — أعد تفعيلها ليتمكن الزبائن من الطلب.",
      path: `/dashboard/${slug}`,
    };
  }
  const lapsed = customersFromOrders(orders).filter((c) => c.tags.includes("lapsed"));
  if (lapsed.length >= 3) {
    return {
      en: `${lapsed.length} customers haven't ordered in 30+ days — send them a win-back campaign.`,
      ar: `${lapsed.length} من الزبائن لم يطلبوا منذ أكثر من ٣٠ يومًا — أرسل لهم حملة استعادة.`,
      path: `/dashboard/${slug}/marketing`,
    };
  }
  if (!restaurant.googleReviewsUrl) {
    return {
      en: "Add your Google review link in Settings to turn on automatic review requests.",
      ar: "أضف رابط تقييم جوجل في الإعدادات لتفعيل طلبات التقييم التلقائية.",
      path: `/dashboard/${slug}/settings`,
    };
  }
  if (!restaurant.loyaltySettings.enabled) {
    return {
      en: "Turn on the loyalty punch card to bring regulars back more often.",
      ar: "فعّل بطاقة الولاء لإعادة زبائنك الدائمين أكثر.",
      path: `/dashboard/${slug}/marketing`,
    };
  }
  return {
    en: "Review this week's best sellers — consider featuring them at the top of your menu.",
    ar: "راجع الأصناف الأكثر مبيعًا هذا الأسبوع — فكّر بإبرازها أعلى القائمة.",
    path: `/dashboard/${slug}/menu`,
  };
}

function isoWeekKey(d = new Date()): string {
  // Monday-anchored: the report covers the week that ENDED yesterday.
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function sendWeeklyReports(origin: string): Promise<{ sent: number; skipped: number }> {
  const store = getStore();
  const restaurants = await store.listAllRestaurants();
  let sent = 0;
  let skipped = 0;

  for (const restaurant of restaurants) {
    try {
      const orders = await store.listOrders(restaurant.id);
      const stats = computeWeeklyStats(orders, restaurant.timezone);
      // Quiet tenants get no report — an all-zeros email reads as spam.
      if (stats.orders === 0 && stats.prevOrders === 0) {
        skipped++;
        continue;
      }
      // Atomic once-per-week guard — a cron retry never double-sends.
      if (!(await store.tryRecordAutomation(restaurant.id, "weekly_report", "owner", isoWeekKey()))) {
        skipped++;
        continue;
      }

      const ownerEmail = await store.getOwnerEmail(restaurant.id);
      const action = suggestAction(restaurant, orders);
      if (ownerEmail) {
        const email = renderWeeklyEmail(restaurant, stats, action, origin);
        await getEmailChannel().send({ to: ownerEmail, ...email });
      }
      if (restaurant.phone) {
        await getSmsChannel().send({
          to: restaurant.phone,
          body: `Sofratak: your weekly report is ready — ${stats.orders} orders, ${money(stats.revenueCents)}. ${origin}/en/dashboard/${restaurant.slug}`,
        });
      }
      sent++;
    } catch (err) {
      console.error(`[weekly-report] failed for ${restaurant.slug}`, err);
    }
  }

  return { sent, skipped };
}
