import "server-only";
import type {
  AdminAuditEntry,
  AutomationKind,
  Campaign,
  CustomerProfile,
  DayHours,
  LoyaltyAccount,
  MarketingOptIn,
  Menu,
  MenuCategory,
  MenuItem,
  NewCampaignInput,
  NewOfferCodeInput,
  NewRestaurantInput,
  OfferCode,
  Order,
  OrderRefund,
  OrderStatus,
  Restaurant,
  SmsRecord,
} from "./types";
import { LocalStore } from "./local-store";
import { SupabaseStore } from "./supabase-store";

export interface DataStore {
  getRestaurantBySlug(slug: string): Promise<Restaurant | null>;
  getRestaurantById(id: string): Promise<Restaurant | null>;
  getMenu(restaurantId: string): Promise<Menu | null>;
  createOrder(order: Order): Promise<void>;
  getOrder(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null>;
  /** Idempotent pending → paid flip; returns null unless it transitioned. */
  markOrderPaid(id: string, paymentRef: string): Promise<Order | null>;
  markUnacceptedAlert(id: string): Promise<void>;
  /** Append a refund and set the resulting payment status. */
  addOrderRefund(
    id: string,
    refund: OrderRefund,
    paymentStatus: Order["paymentStatus"],
  ): Promise<Order | null>;
  setOrderingPaused(restaurantId: string, paused: boolean): Promise<void>;
  listOrders(restaurantId: string): Promise<Order[]>;
  recordSms(sms: SmsRecord): Promise<void>;
  /** Menu manager (Phase 4). Insert when the id is new, update otherwise. */
  upsertMenuItem(restaurantId: string, item: MenuItem): Promise<void>;
  deleteMenuItem(restaurantId: string, itemId: string): Promise<void>;
  updateRestaurantSettings(
    restaurantId: string,
    settings: { ordering: Restaurant["ordering"]; hours: DayHours[] },
  ): Promise<void>;
  setStripeAccount(
    restaurantId: string,
    accountId: string,
    chargesEnabled: boolean,
  ): Promise<void>;

  // ── Phase 7: billing ────────────────────────────────────────────────
  setBillingInfo(
    restaurantId: string,
    billing: Partial<Restaurant["billing"]>,
  ): Promise<void>;
  getRestaurantByCustomerId(stripeCustomerId: string): Promise<Restaurant | null>;
  getRestaurantBySubscriptionId(subscriptionId: string): Promise<Restaurant | null>;
  markCancelExportSent(restaurantId: string): Promise<boolean>;
  /** For billing emails/SMS — the restaurant_members(role=owner) user's email. */
  getOwnerEmail(restaurantId: string): Promise<string | null>;

  // ── Phase 7: internal admin ─────────────────────────────────────────
  listAllRestaurants(): Promise<Restaurant[]>;
  createRestaurant(input: NewRestaurantInput): Promise<Restaurant>;
  /** Creates the owner's Supabase Auth login (or reuses it if the email already has one) and memberships them in. */
  createOwnerAccount(
    restaurantId: string,
    email: string,
  ): Promise<{ userId: string; temporaryPassword: string | null }>;
  recordAuditLog(entry: Omit<AdminAuditEntry, "id" | "createdAt">): Promise<void>;
  listAuditLog(restaurantId?: string): Promise<AdminAuditEntry[]>;
  upsertMenuCategory(restaurantId: string, category: MenuCategory): Promise<void>;

  // ── Phase 5: campaigns (email + SMS) ─────────────────────────────────
  createCampaign(restaurantId: string, input: NewCampaignInput): Promise<Campaign>;
  listCampaigns(restaurantId: string): Promise<Campaign[]>;
  markCampaignSent(
    id: string,
    recipientCount: number,
    sentCount: number,
    failedCount: number,
  ): Promise<void>;

  // ── Phase 5: marketing opt-in (separate from transactional SMS) ──────
  getMarketingOptIn(restaurantId: string, phone: string): Promise<MarketingOptIn | null>;
  setMarketingOptIn(
    restaurantId: string,
    phone: string,
    patch: Partial<Pick<MarketingOptIn, "email" | "smsOptedIn" | "emailOptedIn" | "source">>,
  ): Promise<void>;
  /** STOP handling — permanently suppresses SMS marketing for this number at this restaurant. */
  unsubscribeSms(restaurantId: string, phone: string): Promise<void>;
  /** Same, across every restaurant — used for inbound STOP replies to the one shared Twilio number. */
  unsubscribeSmsEverywhere(phone: string): Promise<void>;
  listOptedIn(restaurantId: string, channel: "sms" | "email"): Promise<MarketingOptIn[]>;

  // ── Phase 5: customer profile (birthday today) ───────────────────────
  getCustomerProfile(restaurantId: string, phone: string): Promise<CustomerProfile | null>;
  setCustomerBirthday(restaurantId: string, phone: string, birthday: string): Promise<void>;
  listBirthdaysToday(restaurantId: string, monthDay: string): Promise<CustomerProfile[]>;

  // ── Phase 5: offer codes ──────────────────────────────────────────────
  createOfferCode(restaurantId: string, input: NewOfferCodeInput): Promise<OfferCode>;
  listOfferCodes(restaurantId: string): Promise<OfferCode[]>;
  setOfferCodeActive(restaurantId: string, id: string, active: boolean): Promise<void>;
  /** Atomic: fails with a reason rather than silently no-op-ing. */
  validateAndRedeemOfferCode(
    restaurantId: string,
    code: string,
  ): Promise<
    | { ok: true; offerCode: OfferCode }
    | { ok: false; error: "not_found" | "expired" | "exhausted" }
  >;

  // ── Phase 5: loyalty ───────────────────────────────────────────────────
  getLoyaltyAccount(restaurantId: string, phone: string): Promise<LoyaltyAccount | null>;
  earnLoyaltyPoints(restaurantId: string, phone: string, delta: number, reason: string): Promise<void>;
  /** Atomic: fails rather than letting a balance go negative. */
  redeemLoyaltyPoints(
    restaurantId: string,
    phone: string,
    delta: number,
    reason: string,
  ): Promise<{ ok: true } | { ok: false; error: "insufficient_points" }>;
  setLoyaltySettings(restaurantId: string, settings: Restaurant["loyaltySettings"]): Promise<void>;

  // ── Phase 5: automations ──────────────────────────────────────────────
  setAutomationSettings(restaurantId: string, settings: Restaurant["automations"]): Promise<void>;
  /** Atomic idempotency guard — true only the first time for this (kind, phone, ref). */
  tryRecordAutomation(
    restaurantId: string,
    kind: AutomationKind,
    phone: string,
    ref: string,
  ): Promise<boolean>;
}

let backend: DataStore | null = null;
let warned = false;

async function resolveBackend(): Promise<DataStore> {
  if (backend) return backend;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const supabase = new SupabaseStore(url, key);
    if (await supabase.schemaReady()) {
      backend = supabase;
      return backend;
    }
    if (!warned) {
      warned = true;
      console.warn(
        "[db] Supabase reachable but schema missing — using the local JSON store. " +
          "Apply supabase/migrations/0001_init.sql (SQL editor), run `npx tsx scripts/seed-supabase.ts`, then restart.",
      );
    }
  }
  backend = new LocalStore();
  return backend;
}

/**
 * Backend is picked once per process: Supabase when SUPABASE_URL is set and
 * the schema is applied, else the local JSON store (CLAUDE.md fallbacks).
 * Proxy keeps getStore() synchronous for call sites; every DataStore method
 * is async anyway.
 */
export function getStore(): DataStore {
  return new Proxy({} as DataStore, {
    get(_target, prop: keyof DataStore) {
      return async (...args: unknown[]) => {
        const store = await resolveBackend();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (store[prop] as any)(...args);
      };
    },
  });
}
