"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/db/store";
import {
  getMembership,
  getMembershipByRestaurantId,
} from "@/lib/auth/server";
import { refundOrder, type RefundRequest } from "@/lib/orders/refunds";
import type { DayHours, LocalizedText, Restaurant, SubscriptionTier } from "@/lib/db/types";
import { IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";

const UNAUTHORIZED = { ok: false as const, error: "Unauthorized" };

/** Ends a support impersonation session started from /admin. */
export async function stopImpersonationAction() {
  const { cookies } = await import("next/headers");
  (await cookies()).delete(IMPERSONATION_COOKIE);
  return { ok: true as const };
}

export type MenuItemInput = {
  /** null = create new item */
  id: string | null;
  categoryId: string;
  name: LocalizedText;
  description: LocalizedText;
  /** dollars string from the form, e.g. "9.49" */
  price: string;
  soldOut: boolean;
  /** desired final photo URL; null = no photo (falls back to the category placeholder) */
  imageUrl: string | null;
};

export async function setPausedAction(slug: string, paused: boolean) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  await getStore().setOrderingPaused(membership.restaurant.id, paused);
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const };
}

export async function refundOrderAction(orderId: string, request: RefundRequest) {
  const order = await getStore().getOrder(orderId);
  if (!order) return { ok: false as const, error: "Order not found" };
  if (!(await getMembershipByRestaurantId(order.restaurantId))) return UNAUTHORIZED;
  return refundOrder(orderId, request);
}

export async function saveMenuItemAction(slug: string, input: MenuItemInput) {
  if (!(await getMembership(slug))) return UNAUTHORIZED;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };
  const menu = await store.getMenu(restaurant.id);
  if (!menu) return { ok: false as const, error: "Menu unavailable" };

  const nameEn = input.name.en.trim().slice(0, 120);
  const nameAr = input.name.ar.trim().slice(0, 120);
  if (!nameEn) return { ok: false as const, error: "English name is required" };
  const priceCents = Math.round(parseFloat(input.price) * 100);
  if (!Number.isFinite(priceCents) || priceCents < 0 || priceCents > 50_000)
    return { ok: false as const, error: "Enter a valid price" };
  const category = menu.categories.find((c) => c.id === input.categoryId);
  if (!category) return { ok: false as const, error: "Pick a category" };

  const existing = input.id ? menu.items.find((i) => i.id === input.id) : null;
  if (input.id && !existing) return { ok: false as const, error: "Item not found" };

  // Photo URL must be one of ours: an upload in THIS restaurant's storage
  // folder or a bundled placeholder — never an arbitrary external URL.
  let imageUrl = input.imageUrl;
  if (imageUrl !== null) {
    const uploadPrefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/menu-images/${restaurant.id}/`;
    const ok = imageUrl.startsWith("/demo/") || (process.env.SUPABASE_URL && imageUrl.startsWith(uploadPrefix));
    if (!ok) return { ok: false as const, error: "Invalid photo" };
  } else {
    imageUrl = `/demo/${category.id}.svg`;
  }

  await store.upsertMenuItem(restaurant.id, {
    id: existing?.id ?? `itm-${crypto.randomUUID().slice(0, 8)}`,
    categoryId: category.id,
    name: { en: nameEn, ar: nameAr || nameEn },
    description: {
      en: input.description.en.trim().slice(0, 300),
      ar: input.description.ar.trim().slice(0, 300),
    },
    priceCents,
    imageUrl,
    soldOut: input.soldOut,
    modifierGroupIds: existing?.modifierGroupIds ?? [],
    sort: existing?.sort ?? Math.max(0, ...menu.items.map((i) => i.sort)) + 1,
  });
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const };
}

/** Uploads a menu item photo; the returned URL goes into MenuItemInput.imageUrl. */
export async function uploadMenuImageAction(slug: string, formData: FormData) {
  const membership = await getMembership(slug);
  if (!membership) return { ok: false as const, error: "Unauthorized" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "Pick an image first" };
  const { uploadMenuImage } = await import("@/lib/storage/menu-images");
  return uploadMenuImage(membership.restaurant.id, file);
}

/** Uploads AND saves the storefront banner in one step. */
export async function uploadCoverImageAction(slug: string, formData: FormData) {
  const membership = await getMembership(slug);
  if (!membership) return { ok: false as const, error: "Unauthorized" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "Pick an image first" };
  const { uploadCoverImage } = await import("@/lib/storage/menu-images");
  const result = await uploadCoverImage(membership.restaurant.id, file);
  if (!result.ok) return result;
  await getStore().setCoverImage(membership.restaurant.id, result.url);
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  revalidatePath(`/[locale]/s/${slug}`, "layout");
  return result;
}

export async function removeCoverImageAction(slug: string) {
  const membership = await getMembership(slug);
  if (!membership) return { ok: false as const, error: "Unauthorized" };
  await getStore().setCoverImage(membership.restaurant.id, null);
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  revalidatePath(`/[locale]/s/${slug}`, "layout");
  return { ok: true as const };
}

export async function toggleSoldOutAction(slug: string, itemId: string, soldOut: boolean) {
  if (!(await getMembership(slug))) return UNAUTHORIZED;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };
  const menu = await store.getMenu(restaurant.id);
  const item = menu?.items.find((i) => i.id === itemId);
  if (!item) return { ok: false as const, error: "Item not found" };
  await store.upsertMenuItem(restaurant.id, { ...item, soldOut });
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const };
}

export async function deleteMenuItemAction(slug: string, itemId: string) {
  if (!(await getMembership(slug))) return UNAUTHORIZED;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };
  await store.deleteMenuItem(restaurant.id, itemId);
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const };
}

export async function startConnectOnboardingAction(slug: string, locale: string) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  if (membership.role !== "owner")
    return { ok: false as const, error: "Owner access required" };
  const { headers } = await import("next/headers");
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const { startConnectOnboarding } = await import("@/lib/payments/connect");
  return startConnectOnboarding(
    membership.restaurant,
    `${origin}/${locale}/dashboard/${slug}/settings`,
  );
}

async function currentOrigin(): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
}

export async function startSubscriptionCheckoutAction(
  slug: string,
  tier: SubscriptionTier,
  locale: string,
) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  if (membership.role !== "owner")
    return { ok: false as const, error: "Owner access required" };
  const { startSubscriptionCheckout } = await import("@/lib/billing/stripe");
  return startSubscriptionCheckout(
    membership.restaurant,
    tier,
    await currentOrigin(),
    locale as "en" | "ar",
  );
}

export async function openBillingPortalAction(slug: string, locale: string) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  if (membership.role !== "owner")
    return { ok: false as const, error: "Owner access required" };
  const { openBillingPortal } = await import("@/lib/billing/stripe");
  const origin = await currentOrigin();
  return openBillingPortal(
    membership.restaurant,
    `${origin}/${locale}/dashboard/${slug}/settings/billing`,
  );
}

export async function cancelSubscriptionAction(slug: string) {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  if (membership.role !== "owner")
    return { ok: false as const, error: "Owner access required" };
  const { cancelSubscription } = await import("@/lib/billing/stripe");
  const result = await cancelSubscription(membership.restaurant);
  revalidatePath(`/[locale]/dashboard/${slug}/settings/billing`, "page");
  return result;
}

export async function saveSettingsAction(
  slug: string,
  input: { ordering: Restaurant["ordering"]; hours: DayHours[] },
) {
  if (!(await getMembership(slug))) return UNAUTHORIZED;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };

  const o = input.ordering;
  if (!o.pickup && !o.delivery)
    return { ok: false as const, error: "Enable pickup or delivery" };
  const intIn = (n: number, max: number) =>
    Number.isInteger(n) && n >= 0 && n <= max;
  if (
    !intIn(o.deliveryFeeCents, 5_000) ||
    !intIn(o.deliveryMinimumCents, 100_000) ||
    !intIn(o.prepMinutes, 240)
  )
    return { ok: false as const, error: "Check the delivery and prep values" };

  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  const hours = input.hours.filter(
    (h) =>
      Number.isInteger(h.day) &&
      h.day >= 0 &&
      h.day <= 6 &&
      TIME_RE.test(h.open) &&
      TIME_RE.test(h.close),
  );

  await store.updateRestaurantSettings(restaurant.id, {
    ordering: { ...o, paused: restaurant.ordering.paused },
    hours,
  });
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const };
}

/**
 * Owner-editable /eat listing description (directory decision #5c) —
 * writes custom_blurb on the listing this restaurant has claimed, which
 * overrides Google's live editorialSummary on the public page.
 */
export async function saveDirectoryBlurbAction(
  slug: string,
  input: { en: string; ar: string },
) {
  if (!(await getMembership(slug))) return UNAUTHORIZED;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };
  const listing = await store.getDirectoryListingByRestaurant(restaurant.id);
  if (!listing) return { ok: false as const, error: "No claimed listing" };

  const en = input.en.trim().slice(0, 500);
  const ar = input.ar.trim().slice(0, 500);
  await store.setDirectoryBlurb(listing.id, en || null, ar || null);
  revalidatePath(`/[locale]/eat/${listing.city}/${listing.slug}`, "page");
  return { ok: true as const };
}

// ── Concierge requests (docs/concierge-requests-spec.md) ───────────────

const PRICING_RE =
  /pric(e|ing)|fee|checkout|commission|surcharge|سعر|أسعار|تسعير|رسوم|عمولة|الدفع/i;

const REQUEST_CATEGORIES = new Set([
  "storefront", "menu", "dashboard", "orders", "marketing", "idea", "other",
]);
const REQUEST_KINDS = new Set(["fix", "change", "add", "teach", "other"]);

export type CreateServiceRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * FormData: category, kind, target (JSON), note, noteLocale, voice?,
 * photo? (Files). Media goes to the private request-media bucket;
 * pricing/fee/checkout language auto-flags for Zizo per CLAUDE.md.
 */
export async function createServiceRequestAction(
  slug: string,
  form: FormData,
): Promise<CreateServiceRequestResult> {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  const restaurant = membership.restaurant;

  const category = String(form.get("category") ?? "");
  const kind = String(form.get("kind") ?? "");
  if (!REQUEST_CATEGORIES.has(category) || !REQUEST_KINDS.has(kind)) {
    return { ok: false, error: "Invalid request" };
  }
  let target: Record<string, unknown> = {};
  try {
    target = JSON.parse(String(form.get("target") ?? "{}"));
  } catch {
    target = {};
  }
  const note = String(form.get("note") ?? "").trim().slice(0, 2000) || null;
  const noteLocale = String(form.get("noteLocale") ?? "en") === "ar" ? "ar" : "en";

  const { uploadRequestMedia } = await import("@/lib/storage/request-media");
  let voiceUrl: string | null = null;
  let photoUrl: string | null = null;
  const voice = form.get("voice");
  if (voice instanceof File && voice.size > 0) {
    const up = await uploadRequestMedia(restaurant.id, voice, "voice");
    if (!up.ok) return { ok: false, error: up.error };
    voiceUrl = up.path;
  }
  const photo = form.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const up = await uploadRequestMedia(restaurant.id, photo, "photo");
    if (!up.ok) return { ok: false, error: up.error };
    photoUrl = up.path;
  }

  const pricingFlag = PRICING_RE.test(note ?? "");
  const request = await getStore().createServiceRequest({
    restaurantId: restaurant.id,
    category: category as never,
    target,
    kind: kind as never,
    note,
    noteLocale,
    voiceUrl,
    photoUrl,
    pricingFlag,
  });

  // heads-up to Zizo on every new request (console fallback in dev)
  const { getEmailChannel } = await import("@/lib/email");
  await getEmailChannel().send({
    subject: `[Sofratak request] ${restaurant.name.en} — ${category}/${kind}${pricingFlag ? " ⚠ PRICING" : ""}`,
    text: [
      `Restaurant: ${restaurant.name.en} (${slug})`,
      `Category: ${category} · Kind: ${kind}`,
      `Target: ${JSON.stringify(target)}`,
      note ? `Note (${noteLocale}): ${note}` : "No note",
      voiceUrl ? "Has voice note" : "",
      photoUrl ? "Has photo" : "",
      pricingFlag ? "⚠ Touches pricing/fees — needs Zizo's explicit call (CLAUDE.md)" : "",
      `Admin queue: /admin/requests`,
    ].filter(Boolean).join("\n"),
  });

  revalidatePath(`/[locale]/dashboard/${slug}/requests`, "page");
  return { ok: true, id: request.id };
}

/** The owner's one follow-up per request (thread-lite, not a chat). */
export async function replyServiceRequestAction(
  slug: string,
  id: string,
  text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const membership = await getMembership(slug);
  if (!membership) return UNAUTHORIZED;
  const store = getStore();
  const request = await store.getServiceRequest(id);
  if (!request || request.restaurantId !== membership.restaurant.id) {
    return { ok: false, error: "Not found" };
  }
  if (request.ownerReply) return { ok: false, error: "Already replied" };
  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return { ok: false, error: "Empty reply" };
  await store.updateServiceRequest(id, {
    ownerReply: trimmed,
    // answering a question puts it back in our court
    status: request.status === "waiting" ? "in_progress" : request.status,
  });
  revalidatePath(`/[locale]/dashboard/${slug}/requests`, "page");
  return { ok: true };
}
