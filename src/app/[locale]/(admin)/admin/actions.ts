"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getStore } from "@/lib/db/store";
import { getSuperAdmin } from "@/lib/auth/server";
import { createImpersonationToken, IMPERSONATION_COOKIE } from "@/lib/auth/impersonation";
import { getMenuImportProvider } from "@/lib/menu-import/text-provider";
import type { ParsedMenu, ParsedMenuCategory } from "@/lib/menu-import/types";
import type { NewRestaurantInput } from "@/lib/db/types";

const FORBIDDEN = { ok: false as const, error: "Forbidden" };
const EMPTY_PARSE: ParsedMenu = { categories: [], skippedLines: [] };

async function auditActor(admin: { user: { id: string; email?: string | null } }) {
  return { actorUserId: admin.user.id, actorEmail: admin.user.email ?? admin.user.id };
}

export async function createTenantAction(input: NewRestaurantInput) {
  const admin = await getSuperAdmin();
  if (!admin) return FORBIDDEN;

  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    return { ok: false as const, error: "Slug must be lowercase letters, numbers, and hyphens" };
  }
  const nameEn = input.name.en.trim().slice(0, 80);
  if (!nameEn) return { ok: false as const, error: "English name is required" };
  const email = input.ownerEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Enter a valid owner email" };
  }

  const store = getStore();
  if (await store.getRestaurantBySlug(slug)) {
    return { ok: false as const, error: "That slug is already taken" };
  }

  const restaurant = await store.createRestaurant({
    ...input,
    slug,
    name: { en: nameEn, ar: input.name.ar.trim() || nameEn },
    ownerEmail: email,
  });
  const { temporaryPassword } = await store.createOwnerAccount(restaurant.id, email);
  await store.recordAuditLog({
    ...(await auditActor(admin)),
    action: "tenant.create",
    targetRestaurantId: restaurant.id,
    details: { slug: restaurant.slug, ownerEmail: email },
  });

  revalidatePath("/[locale]/admin", "page");
  return { ok: true as const, slug: restaurant.slug, ownerEmail: email, temporaryPassword };
}

export async function startImpersonationAction(slug: string) {
  const admin = await getSuperAdmin();
  if (!admin) return FORBIDDEN;
  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };

  const actor = await auditActor(admin);
  const token = createImpersonationToken({
    restaurantId: restaurant.id,
    adminUserId: admin.user.id,
    adminEmail: actor.actorEmail,
  });
  if (!token) {
    return { ok: false as const, error: "Impersonation is not configured (IMPERSONATION_SECRET)" };
  }

  (await cookies()).set(IMPERSONATION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });

  await getStore().recordAuditLog({
    ...actor,
    action: "tenant.impersonate",
    targetRestaurantId: restaurant.id,
    details: { slug },
  });

  return { ok: true as const };
}

/** The one tenant the demo reset may ever touch. */
const DEMO_SLUG = "beitzizo";

export async function resetDemoAction() {
  const admin = await getSuperAdmin();
  if (!admin) return FORBIDDEN;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(DEMO_SLUG);
  if (!restaurant) return { ok: false as const, error: "Demo restaurant not found" };

  await store.resetDemoRestaurant();
  await store.recordAuditLog({
    ...(await auditActor(admin)),
    action: "demo.reset",
    targetRestaurantId: restaurant.id,
    details: { slug: DEMO_SLUG },
  });
  revalidatePath("/[locale]/admin", "layout");
  return { ok: true as const };
}

/** Approve or reject a directory review-queue listing (ambiguous OSM imports). */
export async function reviewDirectoryListingAction(id: string, approve: boolean) {
  const admin = await getSuperAdmin();
  if (!admin) return FORBIDDEN;
  const store = getStore();
  if (approve) await store.setDirectoryPublished(id, true);
  else await store.deleteDirectoryListing(id);
  await store.recordAuditLog({
    ...(await auditActor(admin)),
    action: approve ? "directory.approve" : "directory.reject",
    targetRestaurantId: null,
    details: { listingId: id },
  });
  revalidatePath("/[locale]/admin/directory", "page");
  return { ok: true as const };
}

export async function parseMenuTextAction(text: string): Promise<ParsedMenu> {
  if (!(await getSuperAdmin())) return EMPTY_PARSE;
  return getMenuImportProvider().parse({ text: text.slice(0, 20_000) });
}

export async function commitMenuImportAction(slug: string, categories: ParsedMenuCategory[]) {
  const admin = await getSuperAdmin();
  if (!admin) return FORBIDDEN;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };

  let itemCount = 0;
  for (const [categoryIndex, category] of categories.entries()) {
    const name = category.name.trim().slice(0, 60);
    if (!name || category.items.length === 0) continue;
    const categoryId = `cat-${crypto.randomUUID().slice(0, 8)}`;
    await store.upsertMenuCategory(restaurant.id, {
      id: categoryId,
      name: { en: name, ar: name },
      sort: categoryIndex,
    });
    for (const [itemIndex, item] of category.items.entries()) {
      const itemName = item.name.trim().slice(0, 120);
      const priceCents = Math.round(item.price * 100);
      if (!itemName || !Number.isFinite(priceCents) || priceCents <= 0 || priceCents > 50_000) continue;
      await store.upsertMenuItem(restaurant.id, {
        id: `itm-${crypto.randomUUID().slice(0, 8)}`,
        categoryId,
        name: { en: itemName, ar: itemName },
        description: { en: "", ar: "" },
        priceCents,
        imageUrl: null,
        soldOut: false,
        modifierGroupIds: [],
        sort: itemIndex,
      });
      itemCount++;
    }
  }

  await store.recordAuditLog({
    ...(await auditActor(admin)),
    action: "tenant.menu_import",
    targetRestaurantId: restaurant.id,
    details: { categories: categories.length, items: itemCount },
  });

  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const, itemCount };
}

// ── Concierge requests queue (docs/concierge-requests-spec.md §4) ──────

/**
 * One-click status change + optional reply. A reply (or completion)
 * texts the restaurant via the existing SMS adapter and shows up in
 * their dashboard immediately. Audit-logged like every admin action.
 */
export async function updateServiceRequestAction(
  id: string,
  patch: { status?: "received" | "in_progress" | "waiting" | "done"; reply?: string },
) {
  const admin = await getSuperAdmin();
  if (!admin) return FORBIDDEN;
  const store = getStore();
  const request = await store.getServiceRequest(id);
  if (!request) return { ok: false as const, error: "Not found" };

  const reply = patch.reply?.trim().slice(0, 1000);
  const status = patch.status ?? request.status;
  await store.updateServiceRequest(id, {
    status,
    ...(reply ? { reply } : {}),
    ...(status === "done" && request.status !== "done"
      ? { completedAt: new Date().toISOString() }
      : {}),
  });

  await store.recordAuditLog({
    ...(await auditActor(admin)),
    action: "request.update",
    targetRestaurantId: request.restaurantId,
    details: { requestId: id, status, replied: Boolean(reply) },
  });

  // SMS the owner when we reply or finish — the 24h promise, kept loudly
  if (reply || (status === "done" && request.status !== "done")) {
    const restaurant = await store.getRestaurantById(request.restaurantId);
    if (restaurant?.phone) {
      const { getSmsChannel } = await import("@/lib/sms");
      const body =
        status === "done"
          ? `Sofratak: your request is done and live. ${reply ?? ""}`.trim()
          : `Sofratak: update on your request — ${reply}`;
      await getSmsChannel().send({ to: restaurant.phone, body });
    }
  }

  revalidatePath("/[locale]/admin/requests", "page");
  return { ok: true as const };
}
