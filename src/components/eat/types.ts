/** Serializable listing view composed server-side for the /eat client UI. */
export type EatListingView = {
  id: string;
  slug: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  cuisines: string[];
  halalStatus: "verified" | "reported" | "unknown";
  /** claimed by a Sofratak restaurant → Order Now, photo, live hours */
  verified: boolean;
  /** null = hours unknown; no open/closed chip shown */
  openNow: boolean | null;
  /** locale-free storefront path for verified listings, e.g. "/s/beitzizo" */
  orderPath: string | null;
  /** verified listings only (their storefront banner) */
  photoUrl: string | null;
  /** unclaimed + has a stored place_id → card may lazy-load a live Google photo */
  hasLivePhotos: boolean;
};
