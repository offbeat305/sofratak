/**
 * Wire types for /api/mobile/* — kept in lockstep with the serializers in
 * ../src/lib/mobile/api.ts (the web repo is the source of truth; if a
 * field changes there, change it here in the same commit).
 */

export type Localized = { en: string; ar: string };
export type Locale = "en" | "ar";

export type RestaurantSummary = {
  slug: string;
  name: Localized;
  tagline: Localized;
  logoUrl: string | null;
  coverUrl: string | null;
  brand: { primary: string; accent: string };
  halal: boolean;
  city: string;
  state: string;
};

export type DayHours = {
  day: number;
  open: string;
  close: string;
  closed: boolean;
};

export type LoyaltyReward = {
  id: string;
  name: Localized;
  punchesNeeded: number;
  valueCents: number;
};

export type RestaurantView = {
  slug: string;
  name: Localized;
  tagline: Localized;
  logoUrl: string | null;
  coverUrl: string | null;
  brand: { primary: string; accent: string };
  halal: boolean;
  phone: string;
  address: { line1: string; city: string; state: string; zip: string };
  timezone: string;
  hours: DayHours[];
  ordering: {
    pickup: boolean;
    delivery: boolean;
    deliveryFeeCents: number;
    deliveryMinimumCents: number;
    prepMinutes: number;
    paused: boolean;
  };
  loyalty: { enabled: boolean; rewards: LoyaltyReward[] };
};

export type MenuCategory = { id: string; name: Localized; sort: number };

export type ModifierOption = { id: string; name: Localized; priceDeltaCents: number };

export type ModifierGroup = {
  id: string;
  name: Localized;
  min: number;
  max: number;
  options: ModifierOption[];
};

export type MenuItem = {
  id: string;
  categoryId: string;
  name: Localized;
  description: Localized;
  priceCents: number;
  imageUrl: string | null;
  soldOut: boolean;
  modifierGroupIds: string[];
  sort: number;
};

export type MenuView = {
  categories: MenuCategory[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
};

export type StorefrontResponse = { restaurant: RestaurantView; menu: MenuView };

export type CartLine = {
  menuItemId: string;
  qty: number;
  options: Record<string, string[]>;
  notes: string | null;
};

export type Fulfillment = "pickup" | "delivery";

export type PlaceOrderRequest = {
  restaurantSlug: string;
  locale: Locale;
  fulfillment: Fulfillment;
  scheduledFor: string | null;
  customer: { name: string; phone: string; smsOptIn: boolean };
  deliveryAddress: string | null;
  tipCents: number;
  offerCode: string | null;
  redeemRewardId: string | null;
  lines: CartLine[];
  pushToken: string | null;
};

export type PlaceOrderResponse =
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

export type OrderStatus =
  | "received"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "canceled";

export type OrderLineModifier = {
  groupName: Localized;
  optionName: Localized;
  priceDeltaCents: number;
};

export type OrderLine = {
  menuItemId: string;
  name: Localized;
  qty: number;
  unitPriceCents: number;
  modifiers: OrderLineModifier[];
  notes: string | null;
  lineTotalCents: number;
};

export type OrderView = {
  id: string;
  number: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  scheduledFor: string | null;
  customerName: string;
  deliveryAddress: string | null;
  lines: OrderLine[];
  subtotalCents: number;
  serviceFeeCents: number;
  deliveryFeeCents: number;
  tipCents: number;
  discountCents: number;
  totalCents: number;
  paymentStatus: "pending" | "paid" | "refunded" | "partially_refunded";
  locale: Locale;
  createdAt: string;
};
