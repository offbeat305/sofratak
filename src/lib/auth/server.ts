import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getStore } from "@/lib/db/store";
import type { Restaurant } from "@/lib/db/types";

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
};

/**
 * The auth gate for dashboard/kitchen pages, API routes, and server
 * actions: signed in AND a member of this restaurant. Returns null
 * otherwise — callers redirect or 401.
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
  if (!data) return null;

  return { user, restaurant, role: data.role as "owner" | "staff" };
}

/** Same gate keyed by restaurant id (for actions that only have an order). */
export async function getMembershipByRestaurantId(
  restaurantId: string,
): Promise<Membership | null> {
  const restaurant = await getStore().getRestaurantById(restaurantId);
  if (!restaurant) return null;
  return getMembership(restaurant.slug);
}
