import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

export const revalidate = 300;

/**
 * App entry point: the orderable restaurants on the platform, enough for
 * the picker screen (the app then remembers the diner's choice and opens
 * straight into that storefront next launch — same "one restaurant per
 * diner" reality as the web storefront subdomains).
 */
export async function GET() {
  const restaurants = await getStore().listAllRestaurants();
  return NextResponse.json({
    restaurants: restaurants
      .filter((r) => r.ordering.pickup || r.ordering.delivery)
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        tagline: r.tagline,
        logoUrl: r.logoUrl,
        coverUrl: r.coverUrl,
        brand: r.brand,
        halal: r.halal,
        city: r.address.city,
        state: r.address.state,
      })),
  });
}
