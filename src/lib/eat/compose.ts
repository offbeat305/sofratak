import "server-only";
import { getStore } from "@/lib/db/store";
import { isOpenNow } from "./open-now";
import type { EatMetro } from "@/content/eat-metros";
import type { DirectoryListing } from "@/lib/db/types";
import type { EatListingView } from "@/components/eat/types";

/**
 * Composes the client-facing listing views for a metro. Claimed listings
 * pull live data from the linked restaurant (real hours in the
 * restaurant's own timezone, storefront banner, order path).
 */
export async function composeListingView(
  listing: DirectoryListing,
  metro: EatMetro,
): Promise<EatListingView> {
  const base: EatListingView = {
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    address: listing.address,
    lat: listing.lat,
    lng: listing.lng,
    phone: listing.phone,
    cuisines: listing.cuisines,
    // Hard rule: "verified halal" is only possible on claimed listings —
    // an unclaimed row can never carry it, whatever the data says.
    halalStatus: listing.halalStatus === "verified" ? "reported" : listing.halalStatus,
    verified: false,
    openNow: isOpenNow(listing.hours, metro.timezone),
    orderPath: null,
    photoUrl: null,
  };

  if (!listing.claimedRestaurantId) return base;
  const restaurant = await getStore().getRestaurantById(listing.claimedRestaurantId);
  if (!restaurant) return base;

  return {
    ...base,
    name: restaurant.name.en || listing.name,
    phone: restaurant.phone || listing.phone,
    halalStatus: listing.halalStatus,
    verified: true,
    openNow: isOpenNow(restaurant.hours, restaurant.timezone),
    orderPath: `/s/${restaurant.slug}`,
    photoUrl: restaurant.coverUrl,
  };
}

export async function composeMetroListings(metro: EatMetro): Promise<EatListingView[]> {
  const listings = await getStore().listDirectory(metro.slug);
  // Review-queue rows (ambiguous OSM imports awaiting approval) stay off /eat.
  return Promise.all(listings.filter((l) => l.published).map((l) => composeListingView(l, metro)));
}
