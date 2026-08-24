/** All money values are integer cents (see CLAUDE.md). */

export type LocalizedText = { en: string; ar: string };

/** day: 0 = Sunday … 6 = Saturday. Times are 24h "HH:MM" local to the restaurant. */
export type DayHours = { day: number; open: string; close: string };

export type Restaurant = {
  id: string;
  slug: string;
  name: LocalizedText;
  tagline: LocalizedText;
  logoUrl: string | null;
  coverUrl: string | null;
  /** storefront theme colors (hex) — the restaurant's brand, not Sofratak's */
  brand: { primary: string; accent: string };
  halal: boolean;
  phone: string;
  address: { line1: string; city: string; state: string; zip: string };
  timezone: string;
  hours: DayHours[];
  instagramUrl: string | null;
  googleReviewsUrl: string | null;
  ordering: {
    pickup: boolean;
    delivery: boolean;
    deliveryFeeCents: number;
    deliveryMinimumCents: number;
    /** typical prep time shown to diners for ASAP orders */
    prepMinutes: number;
    /** big obvious pause switch (Phase 4 exposes it in the dashboard) */
    paused: boolean;
  };
  /** Stripe Connect (direct charges when onboarded + charges enabled) */
  stripe: {
    accountId: string | null;
    chargesEnabled: boolean;
  };
  /**
   * Platform subscription billing (Phase 7) — restaurant paying Sofratak,
   * completely separate Stripe object graph from `stripe` above (which is
   * the restaurant's own Connect account for receiving diner payments).
   */
  billing: {
    stripeCustomerId: string | null;
    subscriptionId: string | null;
    tier: "starter" | "growth" | "partner" | null;
    status: "none" | "active" | "past_due" | "canceled";
    periodEnd: string | null;
    canceledAt: string | null;
  };
  /**
   * Phase 5 loyalty. Presented as a punch card everywhere (owner setup
   * and diner checkout speak "after N orders"); a points ledger does the
   * math underneath at 1 punch = 1 point per paid order.
   */
  loyaltySettings: {
    enabled: boolean;
    /** Legacy spend-based earn rate — unused since the punch-card decision; kept for stored-JSON compat. */
    centsPerPoint: number;
    rewards: LoyaltyReward[];
  };
  /** Phase 5: which automated sends are on for this restaurant. */
  automations: {
    winBack: boolean;
    /** An existing offer code to include in the win-back text, if set. */
    winBackOfferCode: string | null;
    welcome: boolean;
    reviewRequest: boolean;
    birthday: boolean;
  };
};

export type LoyaltyReward = {
  id: string;
  name: LocalizedText;
  /** punches (orders) needed — stored as points, 1 punch = 1 point */
  pointsCost: number;
  /** applied as a flat discount at checkout when redeemed */
  valueCents: number;
};

export type SubscriptionTier = NonNullable<Restaurant["billing"]["tier"]>;

export type AdminAuditEntry = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  targetRestaurantId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

/** Minimal shape for creating a new tenant from the admin onboarding wizard. */
export type NewRestaurantInput = {
  slug: string;
  name: LocalizedText;
  phone: string;
  address: Restaurant["address"];
  timezone: string;
  halal: boolean;
  ownerEmail: string;
};

export type ModifierOption = {
  id: string;
  name: LocalizedText;
  priceDeltaCents: number;
};

export type ModifierGroup = {
  id: string;
  name: LocalizedText;
  /** min > 0 makes the group required */
  min: number;
  max: number;
  options: ModifierOption[];
};

export type MenuCategory = {
  id: string;
  name: LocalizedText;
  sort: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: LocalizedText;
  description: LocalizedText;
  priceCents: number;
  imageUrl: string | null;
  soldOut: boolean;
  modifierGroupIds: string[];
  sort: number;
};

export type Menu = {
  categories: MenuCategory[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
};

export const ORDER_STATUSES = [
  "received",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "canceled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Fulfillment = "pickup" | "delivery";

export type OrderLineModifier = {
  groupName: LocalizedText;
  optionName: LocalizedText;
  priceDeltaCents: number;
};

export type OrderLine = {
  menuItemId: string;
  name: LocalizedText;
  qty: number;
  /** base + modifier deltas, per unit */
  unitPriceCents: number;
  modifiers: OrderLineModifier[];
  notes: string | null;
  lineTotalCents: number;
};

export type OrderRefund = {
  id: string;
  amountCents: number;
  /** which lines (by index) and how many units; empty = order-level amount */
  lines: Array<{ lineIndex: number; qty: number }>;
  /** payment processor refund id (or mock ref) */
  ref: string;
  createdAt: string;
};

export type Order = {
  id: string;
  restaurantId: string;
  /** short human-friendly number for tickets/SMS, e.g. "A417" */
  number: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  /** ISO datetime, or null for ASAP */
  scheduledFor: string | null;
  customer: { name: string; phone: string; smsOptIn: boolean };
  deliveryAddress: string | null;
  lines: OrderLine[];
  subtotalCents: number;
  serviceFeeCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  totalCents: number;
  paymentStatus: "pending" | "paid" | "refunded" | "partially_refunded";
  paymentRef: string;
  refunds: OrderRefund[];
  /** Phase 5: offer code applied at checkout, if any. */
  offerCode: string | null;
  discountCents: number;
  /** locale the diner ordered in — drives SMS language */
  locale: "en" | "ar";
  /** set once when the owner is alerted about an unaccepted order */
  unacceptedAlertSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SmsRecord = {
  id: string;
  to: string;
  body: string;
  orderId: string | null;
  sentAt: string;
};

// ── Phase 5: marketing suite ──────────────────────────────────────────

export type CampaignChannel = "email" | "sms";
export type CampaignSegment = "all" | "vip" | "lapsed" | "new";
export type CampaignStatus = "draft" | "sending" | "sent" | "failed";

export type Campaign = {
  id: string;
  restaurantId: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  segment: CampaignSegment;
  /** email only */
  subject: string | null;
  body: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  sentAt: string | null;
};

export type NewCampaignInput = {
  channel: CampaignChannel;
  segment: CampaignSegment;
  subject: string | null;
  body: string;
};

/**
 * Marketing consent — separate from the transactional smsOptIn captured
 * per order (Order.customer.smsOptIn). TCPA treats the two differently;
 * STOP must suppress this record without touching order-status texts.
 */
export type MarketingOptIn = {
  restaurantId: string;
  phone: string;
  email: string | null;
  smsOptedIn: boolean;
  emailOptedIn: boolean;
  consentedAt: string;
  unsubscribedAt: string | null;
  source: string;
};

export type CustomerProfile = {
  restaurantId: string;
  phone: string;
  birthday: string | null; // "YYYY-MM-DD"
};

export type OfferCodeType = "percent" | "flat";

export type OfferCode = {
  id: string;
  restaurantId: string;
  code: string;
  type: OfferCodeType;
  /** percent: 1-100; flat: cents off */
  value: number;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

export type NewOfferCodeInput = {
  code: string;
  type: OfferCodeType;
  value: number;
  maxUses: number | null;
  expiresAt: string | null;
};

export type LoyaltyAccount = {
  id: string;
  restaurantId: string;
  phone: string;
  points: number;
};

export type FunnelStep = "view" | "add_to_cart" | "checkout_start";

/** Distinct sessions per step over a window; `paid` comes from orders. */
export type FunnelCounts = {
  views: number;
  carts: number;
  checkouts: number;
};

// ── Directory (docs/directory-spec.md) ────────────────────────────────

export type DirectoryHalalStatus = "verified" | "reported" | "unknown";

export type DirectoryListing = {
  id: string;
  /** metro slug — see src/content/eat-cities.ts */
  city: string;
  slug: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  hours: DayHours[] | null;
  cuisines: string[];
  halalStatus: DirectoryHalalStatus;
  googlePlaceId: string | null;
  claimedRestaurantId: string | null;
  source: "seed" | "places" | "manual";
};

export type AutomationKind =
  | "win_back"
  | "welcome"
  | "review_request"
  | "birthday"
  | "weekly_report";
