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
