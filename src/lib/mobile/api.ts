import "server-only";
import type { Menu, Order, Restaurant } from "@/lib/db/types";

/**
 * Public JSON shapes for the native diner app (docs/mobile-app-spec.md §3).
 * One place to decide what crosses the wire: the app gets exactly what the
 * web storefront renders for a diner and nothing else — no Stripe ids, no
 * billing, no owner-facing fields, no push tokens back out.
 */

export function restaurantPublicView(r: Restaurant) {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    logoUrl: r.logoUrl,
    coverUrl: r.coverUrl,
    brand: r.brand,
    halal: r.halal,
    phone: r.phone,
    address: r.address,
    timezone: r.timezone,
    hours: r.hours,
    ordering: {
      pickup: r.ordering.pickup,
      delivery: r.ordering.delivery,
      deliveryFeeCents: r.ordering.deliveryFeeCents,
      deliveryMinimumCents: r.ordering.deliveryMinimumCents,
      prepMinutes: r.ordering.prepMinutes,
      paused: r.ordering.paused,
    },
    loyalty: r.loyaltySettings.enabled
      ? {
          enabled: true as const,
          rewards: r.loyaltySettings.rewards.map((reward) => ({
            id: reward.id,
            name: reward.name,
            punchesNeeded: reward.pointsCost,
            valueCents: reward.valueCents,
          })),
        }
      : { enabled: false as const, rewards: [] },
  };
}

export function menuPublicView(menu: Menu) {
  // Menu is already diner-facing data; pass through with stable sorting so
  // the app never has to re-sort.
  return {
    categories: [...menu.categories].sort((a, b) => a.sort - b.sort),
    items: [...menu.items].sort((a, b) => a.sort - b.sort),
    modifierGroups: menu.modifierGroups,
  };
}

export function orderPublicView(order: Order) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    fulfillment: order.fulfillment,
    scheduledFor: order.scheduledFor,
    customerName: order.customer.name,
    deliveryAddress: order.deliveryAddress,
    lines: order.lines,
    subtotalCents: order.subtotalCents,
    serviceFeeCents: order.serviceFeeCents,
    deliveryFeeCents: order.deliveryFeeCents,
    tipCents: order.tipCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    paymentStatus: order.paymentStatus,
    locale: order.locale,
    createdAt: order.createdAt,
  };
}

/** Origin for links baked into SMS/push (falls back like the web actions). */
export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("host") ?? url.host;
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
}
