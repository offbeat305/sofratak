import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getStore } from "@/lib/db/store";
import type { Restaurant } from "@/lib/db/types";
import { IMPERSONATION_COOKIE, verifyImpersonationToken } from "@/lib/auth/impersonation";

/**
 * User-scoped Supabase client (anon key + auth cookies). Reads run under
 * RLS as the signed-in user — membership checks can't be spoofed.
 * RSC can't write cookies; token refresh happens in middleware.
 */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // no-op: server components cannot set cookies
        },
      },
    },
  );
}

export type Membership = {
  user: User;
  restaurant: Restaurant;
  role: "owner" | "staff";
  /** Set when this session is a support impersonation, not a real membership. */
  impersonating?: { adminEmail: string };
};

/**
 * The auth gate for dashboard/kitchen pages, API routes, and server
 * actions: signed in AND a member of this restaurant. Returns null
 * otherwise — callers redirect or 401.
 *
 * Falls back to a signed impersonation cookie (set by /admin, see
 * lib/auth/impersonation.ts) so support can act as the owner without a
 * real membership row — every such session is logged at grant time.
 */
export async function getMembership(slug: string): Promise<Membership | null> {
  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) return null;

  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("restaurant_members")
    .select("role")
    .eq("restaurant_id", restaurant.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (data) return { user, restaurant, role: data.role as "owner" | "staff" };

  if (user.app_metadata?.role !== "super_admin") return null;
  const token = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyImpersonationToken(token);
  if (!payload || payload.restaurantId !== restaurant.id || payload.adminUserId !== user.id) {
    return null;
  }
  return {
    user,
    restaurant,
    role: "owner",
    impersonating: { adminEmail: payload.adminEmail },
  };
}

/** Same gate keyed by restaurant id (for actions that only have an order). */
export async function getMembershipByRestaurantId(
  restaurantId: string,
): Promise<Membership | null> {
  const restaurant = await getStore().getRestaurantById(restaurantId);
  if (!restaurant) return null;
  return getMembership(restaurant.slug);
}

export type SuperAdmin = { user: User };

/**
 * Gate for /admin/*: signed in AND app_metadata.role === "super_admin".
 * Mirrors the is_super_admin() Postgres function (0001) so RLS and the
 * app-level gate never disagree. app_metadata is only writable via the
 * service-role key, so a client can't self-grant this.
 */
export async function getSuperAdmin(): Promise<SuperAdmin | null> {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "super_admin") return null;
  return { user };
}
