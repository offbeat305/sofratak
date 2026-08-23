import { dayNumber, netCents } from "@/lib/orders/stats";
import type { Order, Restaurant } from "@/lib/db/types";

/**
 * Pure stats + rendering for the weekly owner report — no store access,
 * no server-only imports, so it stays directly testable. The send
 * orchestration (store reads, idempotency, channels) lives in weekly.ts.
 */

const MARKETPLACE_RATE = 0.25;

export type WeeklyStats = {
  orders: number;
  prevOrders: number;
  revenueCents: number;
  prevRevenueCents: number;
  avgTicketCents: number;
  newCustomers: number;
  returningCustomers: number;
  bestSellers: Array<{ name: { en: string; ar: string }; qty: number }>;
  estimatedSavingsCents: number;
};

export type SuggestedAction = { en: string; ar: string; path: string };

export function computeWeeklyStats(allOrders: Order[], timezone: string): WeeklyStats {
  const paid = allOrders.filter((o) => o.paymentStatus !== "pending");
  const nowDay = dayNumber(new Date(), timezone);
  const age = (o: Order) => nowDay - dayNumber(o.createdAt, timezone);
  // Runs Monday morning: days 1-7 = last Mon–Sun, days 8-14 = the week before.
  const week = paid.filter((o) => age(o) >= 1 && age(o) <= 7);
  const prev = paid.filter((o) => age(o) >= 8 && age(o) <= 14);

  const revenueCents = week.reduce((n, o) => n + netCents(o), 0);
  const prevRevenueCents = prev.reduce((n, o) => n + netCents(o), 0);

  // New = first-ever order landed inside this window; returning = the rest.
  const firstOrderDay = new Map<string, number>();
  for (const o of paid) {
    const key = o.customer.phone.replace(/\D/g, "");
    const day = dayNumber(o.createdAt, timezone);
    const existing = firstOrderDay.get(key);
    if (existing === undefined || day < existing) firstOrderDay.set(key, day);
  }
  const weekPhones = new Set(week.map((o) => o.customer.phone.replace(/\D/g, "")));
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const phone of weekPhones) {
    const firstDay = firstOrderDay.get(phone)!;
    if (nowDay - firstDay <= 7) newCustomers++;
    else returningCustomers++;
  }

  const qtyByItem = new Map<string, { name: { en: string; ar: string }; qty: number }>();
  for (const o of week) {
    for (const line of o.lines) {
      const entry = qtyByItem.get(line.menuItemId);
      if (entry) entry.qty += line.qty;
      else qtyByItem.set(line.menuItemId, { name: line.name, qty: line.qty });
    }
  }
  const bestSellers = [...qtyByItem.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);

  const foodCents = week.reduce((n, o) => n + o.subtotalCents - o.discountCents, 0);

  return {
    orders: week.length,
    prevOrders: prev.length,
    revenueCents,
    prevRevenueCents,
    avgTicketCents: week.length ? Math.round(revenueCents / week.length) : 0,
    newCustomers,
    returningCustomers,
    bestSellers,
    estimatedSavingsCents: Math.round(foodCents * MARKETPLACE_RATE),
  };
}

export function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function deltaText(current: number, prevValue: number): string {
  if (prevValue === 0) return "";
  const pct = Math.round(((current - prevValue) / prevValue) * 100);
  return pct >= 0 ? ` (+${pct}%)` : ` (${pct}%)`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderWeeklyEmail(
  restaurant: Restaurant,
  stats: WeeklyStats,
  action: SuggestedAction,
  origin: string,
): { subject: string; text: string; html: string } {
  const name = restaurant.name.en;
  const actionUrl = `${origin}/en${action.path}`;
  const sellers = stats.bestSellers;

  const subject = `${name} — your week: ${stats.orders} orders, ${money(stats.revenueCents)}`;

  const rows: Array<[string, string, string]> = [
    ["Orders", "الطلبات", `${stats.orders}${deltaText(stats.orders, stats.prevOrders)}`],
    ["Revenue", "الإيرادات", `${money(stats.revenueCents)}${deltaText(stats.revenueCents, stats.prevRevenueCents)}`],
    ["Average ticket", "متوسط الفاتورة", money(stats.avgTicketCents)],
    ["New / returning customers", "زبائن جدد / عائدون", `${stats.newCustomers} / ${stats.returningCustomers}`],
    ...(sellers.length
      ? ([[
          "Best sellers",
          "الأكثر مبيعًا",
          sellers.map((s) => `${s.name.en} ×${s.qty}`).join(" · "),
        ]] as Array<[string, string, string]>)
      : []),
    [
      "Estimated savings vs 25% marketplace rate",
      "التوفير المقدّر مقابل عمولة ٢٥٪",
      `~${money(stats.estimatedSavingsCents)} (estimated, not guaranteed)`,
    ],
  ];

  const text = [
    `${name} — your Sofratak week`,
    "",
    ...rows.map(([en, , v]) => `${en}: ${v}`),
    "",
    `Suggested action: ${action.en}`,
    actionUrl,
    "",
    "— Sofratak · سفرتك",
  ].join("\n");

  const tableRows = rows
    .map(
      ([en, ar, v]) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee6d4;font-size:14px;color:#6b6b6b;">
            ${esc(en)}<br/><span dir="rtl" style="font-size:12px;">${esc(ar)}</span>
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #eee6d4;font-size:15px;font-weight:bold;color:#1f1f1f;white-space:nowrap;" dir="ltr">
            ${esc(v)}
          </td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f7f2e8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f2e8;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#2f4a3c;padding:24px 32px;">
              <span style="font-size:18px;font-weight:bold;color:#f7f2e8;">Sofratak · سفرتك</span><br/>
              <span style="font-size:14px;color:rgba(247,242,232,0.75);">${esc(restaurant.name.en)} — weekly report · التقرير الأسبوعي</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${tableRows}</table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#a9792b;text-transform:uppercase;letter-spacing:0.08em;">This week's move · خطوة هذا الأسبوع</p>
              <p style="margin:0 0 4px;font-size:15px;color:#1f1f1f;">${esc(action.en)}</p>
              <p dir="rtl" style="margin:0 0 14px;font-size:14px;color:#1f1f1f;">${esc(action.ar)}</p>
              <a href="${actionUrl}" style="display:inline-block;background:#a9792b;color:#ffffff;font-weight:bold;font-size:14px;padding:11px 22px;border-radius:10px;text-decoration:none;">Open dashboard · افتح اللوحة</a>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#6b6b6b;">Savings figures are estimates based on a 25% blended marketplace rate — actual results vary. · الأرقام تقديرية وليست مضمونة.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
