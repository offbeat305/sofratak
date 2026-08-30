import "server-only";
import { getStore } from "@/lib/db/store";
import { getPaymentProvider } from "@/lib/payments";
import { getSmsChannel } from "@/lib/sms";
import { dispatchNewOrder } from "@/lib/orders/channels";
import { sendOrderConfirmationPush } from "@/lib/push/expo";
import { SERVICE_FEE_CENTS } from "@/lib/fees";
import { formatCents } from "@/lib/money";
import type {
  Fulfillment,
  Menu,
  Order,
  OrderLine,
  Restaurant,
} from "@/lib/db/types";

export type PlaceOrderInput = {
  restaurantSlug: string;
  locale: "en" | "ar";
  fulfillment: Fulfillment;
  /** ISO datetime or null for ASAP */
  scheduledFor: string | null;
  customer: { name: string; phone: string; smsOptIn: boolean };
  deliveryAddress: string | null;
  tipCents: number;
  /** Phase 5 offer code, applied to the food subtotal only. */
  offerCode: string | null;
  /** Phase 5 loyalty: id of a reward from the restaurant's catalog to redeem. */
  redeemRewardId: string | null;
  lines: Array<{
    menuItemId: string;
    qty: number;
    /** groupId -> selected optionIds */
    options: Record<string, string[]>;
    notes: string | null;
  }>;
  /** Native app only (migration 0016): Expo push token for status updates. */
  pushToken?: string | null;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; redirectUrl: string | null }
  | { ok: false; error: string };

/** Native-app variant: PaymentSheet params instead of a redirect URL. */
export type PlaceMobileOrderResult =
  | { ok: true; orderId: string; payment: null }
  | {
      ok: true;
      orderId: string;
      payment: {
        clientSecret: string;
        stripeAccountId: string | null;
        publishableKey: string;
      };
    }
  | { ok: false; error: string };

const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

/**
 * Prices are recomputed server-side from the live menu — client totals are
 * display-only and never trusted.
 */
function priceLine(
  menu: Menu,
  line: PlaceOrderInput["lines"][number],
): OrderLine | { error: string } {
  const item = menu.items.find((i) => i.id === line.menuItemId);
  if (!item) return { error: `Unknown item ${line.menuItemId}` };
  if (item.soldOut) return { error: `${item.name.en} is sold out` };
  if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > 20)
    return { error: "Invalid quantity" };

  const modifiers: OrderLine["modifiers"] = [];
  let deltaCents = 0;

  for (const group of menu.modifierGroups.filter((g) =>
    item.modifierGroupIds.includes(g.id),
  )) {
    const chosen = line.options[group.id] ?? [];
    const unique = [...new Set(chosen)];
    if (unique.length < group.min || unique.length > group.max)
      return { error: `Selection required for ${group.name.en}` };
    for (const optionId of unique) {
      const option = group.options.find((o) => o.id === optionId);
      if (!option) return { error: `Unknown option in ${group.name.en}` };
      deltaCents += option.priceDeltaCents;
      modifiers.push({
        groupName: group.name,
        optionName: option.name,
        priceDeltaCents: option.priceDeltaCents,
      });
    }
  }
  // Ignore options for groups the item doesn't have (stale client state).

  const unitPriceCents = item.priceCents + deltaCents;
  return {
    menuItemId: item.id,
    name: item.name,
    qty: line.qty,
    unitPriceCents,
    modifiers,
    notes: line.notes?.slice(0, 300) ?? null,
    lineTotalCents: unitPriceCents * line.qty,
  };
}

function confirmationSms(order: Order, restaurant: Restaurant, origin: string) {
  const url = `${origin}/${order.locale}/s/${restaurant.slug}/order/${order.id}`;
  const total = formatCents(order.totalCents, order.locale);
  return order.locale === "ar"
    ? `${restaurant.name.ar}: استلمنا طلبك رقم ${order.number} (${total}). تابع حالة الطلب: ${url}`
    : `${restaurant.name.en}: we received order ${order.number} (${total}). Track it: ${url}`;
}

export async function placeOrder(
  input: PlaceOrderInput,
  origin: string,
): Promise<PlaceOrderResult> {
  const result = await createPricedOrder(input, "web");
  if ("error" in result) return { ok: false, error: result.error };
  const { order, restaurant } = result;

  const payment = await getPaymentProvider().startPayment({
    order,
    restaurant,
    origin,
  });
  if (payment.kind === "error") return { ok: false, error: payment.error };
  if (payment.kind === "redirect") {
    // Stripe-hosted checkout: the order stays pending; the status page (or
    // the webhook) verifies the session and finalizes.
    return { ok: true, orderId: order.id, redirectUrl: payment.url };
  }
  await finalizePaidOrder(order.id, payment.ref, origin);
  return { ok: true, orderId: order.id, redirectUrl: null };
}

/**
 * Native-app entry (docs/mobile-app-spec.md §3/§4): identical validation
 * and pricing via createPricedOrder — the app is just another client —
 * but payment comes back as PaymentSheet params, not a redirect. The
 * order stays pending until /api/mobile/orders/[id]/confirm (or the
 * payment_intent.succeeded webhook) verifies and finalizes it.
 */
export async function placeMobileOrder(
  input: PlaceOrderInput,
  origin: string,
): Promise<PlaceMobileOrderResult> {
  const result = await createPricedOrder(input, "mobile");
  if ("error" in result) return { ok: false, error: result.error };
  const { order, restaurant } = result;

  const payment = await getPaymentProvider().startMobilePayment({ order, restaurant });
  if (payment.kind === "error") return { ok: false, error: payment.error };
  if (payment.kind === "payment_intent") {
    // Persist the intent ref on the pending order NOW — the confirm route
    // verifies the stored ref, never one the app supplies (a client-sent
    // pi_ id from a different, cheaper order would otherwise pass
    // verification on the platform-charges path).
    await getStore().setOrderPaymentRef(order.id, payment.ref);
    return {
      ok: true,
      orderId: order.id,
      payment: {
        clientSecret: payment.clientSecret,
        stripeAccountId: payment.stripeAccountId,
        publishableKey: payment.publishableKey,
      },
    };
  }
  await finalizePaidOrder(order.id, payment.ref, origin);
  return { ok: true, orderId: order.id, payment: null };
}

/** Shared core: validate, price server-side, store the pending order. */
async function createPricedOrder(
  input: PlaceOrderInput,
  channel: "web" | "mobile",
): Promise<{ order: Order; restaurant: Restaurant } | { error: string }> {
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(input.restaurantSlug);
  if (!restaurant) return { error: "Restaurant not found" };
  if (restaurant.ordering.paused)
    return { error: "Ordering is paused right now" };
  const menu = await store.getMenu(restaurant.id);
  if (!menu) return { error: "Menu unavailable" };

  if (input.fulfillment === "delivery" && !restaurant.ordering.delivery)
    return { error: "Delivery is not available" };
  if (input.fulfillment === "pickup" && !restaurant.ordering.pickup)
    return { error: "Pickup is not available" };

  const name = input.customer.name.trim().slice(0, 80);
  const phone = input.customer.phone.trim();
  if (!name) return { error: "Name is required" };
  if (!PHONE_RE.test(phone)) return { error: "Enter a valid phone number" };

  const deliveryAddress =
    input.fulfillment === "delivery"
      ? (input.deliveryAddress ?? "").trim().slice(0, 200)
      : null;
  if (input.fulfillment === "delivery" && !deliveryAddress)
    return { error: "Delivery address is required" };

  if (input.scheduledFor !== null) {
    const when = new Date(input.scheduledFor).getTime();
    if (Number.isNaN(when)) return { error: "Invalid schedule time" };
    const now = Date.now();
    if (when < now - 60_000 || when > now + 7 * 24 * 3600_000)
      return { error: "Pick a time within the next 7 days" };
  }

  if (!input.lines.length) return { error: "Cart is empty" };
  const lines: OrderLine[] = [];
  for (const raw of input.lines) {
    const priced = priceLine(menu, raw);
    if ("error" in priced) return { error: priced.error };
    lines.push(priced);
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const deliveryFeeCents =
    input.fulfillment === "delivery" ? restaurant.ordering.deliveryFeeCents : 0;
  if (
    input.fulfillment === "delivery" &&
    subtotalCents < restaurant.ordering.deliveryMinimumCents
  )
    return {
      error: `Delivery minimum is ${formatCents(restaurant.ordering.deliveryMinimumCents, input.locale)}`,
    };

  const tipCents =
    Number.isInteger(input.tipCents) && input.tipCents >= 0 && input.tipCents <= 50_000
      ? input.tipCents
      : 0;

  // Redeemed here (before payment, not at finalize) — same tradeoff the
  // rest of checkout already accepts for a pending order: a code use can
  // be "spent" by an order that's later abandoned before payment. Simpler
  // than unwinding a redemption after the fact, and abandoned-pending
  // orders are already an accepted edge case elsewhere in this flow.
  let discountCents = 0;
  let offerCode: string | null = null;
  if (input.offerCode?.trim()) {
    const redeemed = await store.validateAndRedeemOfferCode(restaurant.id, input.offerCode);
    if (!redeemed.ok) {
      return {
        error:
          redeemed.error === "expired"
            ? "This code has expired"
            : redeemed.error === "exhausted"
              ? "This code has already been used the maximum number of times"
              : "That code isn't valid",
      };
    }
    offerCode = redeemed.offerCode.code;
    discountCents =
      redeemed.offerCode.type === "percent"
        ? Math.round((subtotalCents * redeemed.offerCode.value) / 100)
        : redeemed.offerCode.value;
    discountCents = Math.min(discountCents, subtotalCents);
  }

  // Punch-card reward redemption (Phase 5, Zizo's punch-card decision):
  // rewards read as "after N orders" to the owner and diner; points do
  // the math underneath (1 punch = 1 point, earned per paid order below).
  // Same pre-payment tradeoff as offer codes above.
  if (input.redeemRewardId) {
    const reward = restaurant.loyaltySettings.enabled
      ? restaurant.loyaltySettings.rewards.find((r) => r.id === input.redeemRewardId)
      : undefined;
    if (!reward) return { error: "That reward isn't available" };
    const redeemed = await store.redeemLoyaltyPoints(
      restaurant.id,
      phone,
      reward.pointsCost,
      `redeem:${reward.id}`,
    );
    if (!redeemed.ok) return { error: "Not enough punches yet for that reward" };
    discountCents += Math.min(reward.valueCents, subtotalCents - discountCents);
  }

  const totalCents =
    subtotalCents - discountCents + SERVICE_FEE_CENTS + deliveryFeeCents + tipCents;

  const id = crypto.randomUUID();
  const number =
    "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 23)] +
    String(Math.floor(100 + Math.random() * 900));

  const now = new Date().toISOString();
  const order: Order = {
    id,
    restaurantId: restaurant.id,
    number,
    status: "received",
    fulfillment: input.fulfillment,
    scheduledFor: input.scheduledFor,
    customer: { name, phone, smsOptIn: Boolean(input.customer.smsOptIn) },
    deliveryAddress,
    lines,
    subtotalCents,
    serviceFeeCents: SERVICE_FEE_CENTS,
    deliveryFeeCents,
    tipCents,
    totalCents,
    paymentStatus: "pending",
    paymentRef: "",
    refunds: [],
    offerCode,
    discountCents,
    locale: input.locale,
    pushToken: channel === "mobile" ? (input.pushToken?.slice(0, 200) ?? null) : null,
    unacceptedAlertSentAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await store.createOrder(order);
  return { order, restaurant };
}

/**
 * Idempotent: flips pending → paid exactly once, then sends the diner
 * confirmation and routes the order to the kitchen. Called by the mock
 * path directly, by the order status page after Stripe redirects back,
 * and by the Stripe webhook in production.
 */
export async function finalizePaidOrder(
  orderId: string,
  paymentRef: string,
  origin: string,
): Promise<Order | null> {
  const store = getStore();
  const order = await store.markOrderPaid(orderId, paymentRef);
  if (!order) return null; // already finalized (or unknown) — do nothing

  const restaurant = await store.getRestaurantById(order.restaurantId);
  if (!restaurant) return order;

  await getSmsChannel().send({
    to: order.customer.phone,
    body: confirmationSms(order, restaurant, origin),
    orderId: order.id,
  });
  // Route to the kitchen (OrderChannel adapters — never blocks a paid order).
  await dispatchNewOrder(order, restaurant, origin);
  // App orders: confirmation push alongside the SMS (never blocking).
  await sendOrderConfirmationPush(order, restaurant);

  // The checkout "text me offers" checkbox IS the marketing opt-in (its
  // own copy says "offers", separate from the always-on confirmation
  // above) — feed it into the same opt-in record campaigns read, so
  // checking it at checkout actually does something. Never downgrades an
  // existing opt-in: a customer who already said yes on the post-order
  // card and then leaves it unchecked on a later order stays opted in.
  if (order.customer.smsOptIn) {
    try {
      await store.setMarketingOptIn(restaurant.id, order.customer.phone, {
        smsOptedIn: true,
        source: "checkout",
      });
    } catch (err) {
      console.error("[marketing] checkout opt-in sync failed", err);
    }
  }

  // Punch-card model (Zizo's call): every paid order = exactly one punch,
  // regardless of order size — 1 punch is stored as 1 point in the ledger.
  // Never blocks the order; a loyalty hiccup shouldn't fail a paid order.
  if (restaurant.loyaltySettings.enabled) {
    try {
      await store.earnLoyaltyPoints(restaurant.id, order.customer.phone, 1, `order:${order.id}`);
    } catch (err) {
      console.error("[loyalty] earn failed", err);
    }
  }

  return order;
}
