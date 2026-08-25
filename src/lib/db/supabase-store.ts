import "server-only";
import { randomBytes } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beitZizo, beitZizoMenu } from "./seed/beit-zizo";
import type { DataStore } from "./store";
import type {
  ServiceRequest,
  AdminAuditEntry,
  AutomationKind,
  Campaign,
  CustomerProfile,
  DayHours,
  DirectoryListing,
  FunnelCounts,
  FunnelStep,
  LoyaltyAccount,
  MarketingOptIn,
  Menu,
  MenuCategory,
  MenuItem,
  ModifierGroup,
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

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToRestaurant(row: any): Restaurant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url,
    brand: row.brand,
    halal: row.halal,
    phone: row.phone,
    address: row.address,
    timezone: row.timezone,
    hours: row.hours,
    instagramUrl: row.instagram_url,
    googleReviewsUrl: row.google_reviews_url,
    ordering: row.ordering,
    stripe: {
      accountId: row.stripe_account_id ?? null,
      chargesEnabled: row.stripe_charges_enabled ?? false,
    },
    billing: {
      stripeCustomerId: row.stripe_customer_id ?? null,
      subscriptionId: row.subscription_id ?? null,
      tier: row.subscription_tier ?? null,
      status: row.subscription_status ?? "none",
      periodEnd: row.subscription_period_end ?? null,
      canceledAt: row.subscription_canceled_at ?? null,
    },
    loyaltySettings: row.loyalty_settings ?? { enabled: false, centsPerPoint: 100, rewards: [] },
    automations: {
      winBack: true,
      winBackOfferCode: null,
      welcome: true,
      reviewRequest: true,
      birthday: false,
      ...row.automations,
    },
  };
}

function rowToCampaign(row: any): Campaign {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    channel: row.channel,
    status: row.status,
    segment: row.segment,
    subject: row.subject ?? null,
    body: row.body,
    recipientCount: row.recipient_count,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? null,
  };
}

function rowToMarketingOptIn(row: any): MarketingOptIn {
  return {
    restaurantId: row.restaurant_id,
    phone: row.phone,
    email: row.email ?? null,
    smsOptedIn: row.sms_opted_in,
    emailOptedIn: row.email_opted_in,
    consentedAt: row.consented_at,
    unsubscribedAt: row.unsubscribed_at ?? null,
    source: row.source,
  };
}

function rowToCustomerProfile(row: any): CustomerProfile {
  return { restaurantId: row.restaurant_id, phone: row.phone, birthday: row.birthday ?? null };
}

function rowToOfferCode(row: any): OfferCode {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    code: row.code,
    type: row.type,
    value: row.value,
    maxUses: row.max_uses ?? null,
    useCount: row.use_count,
    expiresAt: row.expires_at ?? null,
    active: row.active,
    createdAt: row.created_at,
  };
}

function rowToLoyaltyAccount(row: any): LoyaltyAccount {
  return { id: row.id, restaurantId: row.restaurant_id, phone: row.phone, points: row.points };
}

function rowToDirectoryListing(row: any): DirectoryListing {
  return {
    id: row.id,
    city: row.city,
    slug: row.slug,
    name: row.name,
    address: row.address,
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    phone: row.phone ?? null,
    hours: row.hours ?? null,
    cuisines: row.cuisines ?? [],
    halalStatus: row.halal_status,
    googlePlaceId: row.google_place_id ?? null,
    osmId: row.osm_id ?? null,
    claimedRestaurantId: row.claimed_restaurant_id ?? null,
    source: row.source,
    published: row.published ?? true, // column exists after 0011
    customBlurb: row.custom_blurb ?? null, // columns exist after 0012
    customBlurbAr: row.custom_blurb_ar ?? null,
  };
}

function rowToServiceRequest(row: any): ServiceRequest {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    category: row.category,
    target: row.target ?? {},
    kind: row.kind,
    note: row.note ?? null,
    noteLocale: row.note_locale ?? "en",
    voiceUrl: row.voice_url ?? null,
    photoUrl: row.photo_url ?? null,
    status: row.status,
    reply: row.reply ?? null,
    ownerReply: row.owner_reply ?? null,
    pricingFlag: row.pricing_flag ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null,
  };
}

function rowToAuditEntry(row: any): AdminAuditEntry {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    action: row.action,
    targetRestaurantId: row.target_restaurant_id,
    details: row.details ?? {},
    createdAt: row.created_at,
  };
}

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    number: row.number,
    status: row.status,
    fulfillment: row.fulfillment,
    scheduledFor: row.scheduled_for,
    customer: row.customer,
    deliveryAddress: row.delivery_address,
    lines: row.lines,
    subtotalCents: row.subtotal_cents,
    serviceFeeCents: row.service_fee_cents,
    deliveryFeeCents: row.delivery_fee_cents,
    tipCents: row.tip_cents,
    totalCents: row.total_cents,
    paymentStatus: row.payment_status,
    paymentRef: row.payment_ref,
    refunds: row.refunds ?? [],
    offerCode: row.offer_code ?? null,
    discountCents: row.discount_cents ?? 0,
    locale: row.locale,
    unacceptedAlertSentAt: row.unaccepted_alert_sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderToRow(order: Order): Record<string, unknown> {
  return {
    id: order.id,
    restaurant_id: order.restaurantId,
    number: order.number,
    status: order.status,
    fulfillment: order.fulfillment,
    scheduled_for: order.scheduledFor,
    customer: order.customer,
    delivery_address: order.deliveryAddress,
    lines: order.lines,
    subtotal_cents: order.subtotalCents,
    service_fee_cents: order.serviceFeeCents,
    delivery_fee_cents: order.deliveryFeeCents,
    tip_cents: order.tipCents,
    total_cents: order.totalCents,
    payment_status: order.paymentStatus,
    payment_ref: order.paymentRef,
    refunds: order.refunds,
    offer_code: order.offerCode,
    discount_cents: order.discountCents,
    locale: order.locale,
    unaccepted_alert_sent_at: order.unacceptedAlertSentAt,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

/**
 * Server-side store using the service-role client (bypasses RLS — RLS
 * protects the future browser-side dashboard/admin clients, not this path).
 */
export class SupabaseStore implements DataStore {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  /** True when the migration has been applied. */
  async schemaReady(): Promise<boolean> {
    const { error } = await this.client
      .from("restaurants")
      .select("id")
      .limit(1);
    return !error;
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    const { data } = await this.client
      .from("restaurants")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data ? rowToRestaurant(data) : null;
  }

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const { data } = await this.client
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToRestaurant(data) : null;
  }

  async getMenu(restaurantId: string): Promise<Menu | null> {
    const [cats, items, groups] = await Promise.all([
      this.client.from("menu_categories").select("*").eq("restaurant_id", restaurantId),
      this.client.from("menu_items").select("*").eq("restaurant_id", restaurantId),
      this.client.from("modifier_groups").select("*").eq("restaurant_id", restaurantId),
    ]);
    if (cats.error || items.error || groups.error) return null;
    const categories: MenuCategory[] = (cats.data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      sort: r.sort,
    }));
    const menuItems: MenuItem[] = (items.data ?? []).map((r: any) => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      description: r.description,
      priceCents: r.price_cents,
      imageUrl: r.image_url,
      soldOut: r.sold_out,
      modifierGroupIds: r.modifier_group_ids ?? [],
      sort: r.sort,
    }));
    const modifierGroups: ModifierGroup[] = (groups.data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      min: r.min,
      max: r.max,
      options: r.options ?? [],
    }));
    return { categories, items: menuItems, modifierGroups };
  }

  async createOrder(order: Order): Promise<void> {
    const { error } = await this.client.from("orders").insert(orderToRow(order));
    if (error) throw new Error(`createOrder failed: ${error.message}`);
  }

  async getOrder(id: string): Promise<Order | null> {
    const { data } = await this.client
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToOrder(data) : null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const { data } = await this.client
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? rowToOrder(data) : null;
  }

  async markOrderPaid(id: string, paymentRef: string): Promise<Order | null> {
    // .eq payment_status pending makes the pending→paid flip atomic/idempotent
    const { data } = await this.client
      .from("orders")
      .update({
        payment_status: "paid",
        payment_ref: paymentRef,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("payment_status", "pending")
      .select()
      .maybeSingle();
    return data ? rowToOrder(data) : null;
  }

  async markUnacceptedAlert(id: string): Promise<void> {
    await this.client
      .from("orders")
      .update({ unaccepted_alert_sent_at: new Date().toISOString() })
      .eq("id", id);
  }

  async addOrderRefund(
    id: string,
    refund: OrderRefund,
    paymentStatus: Order["paymentStatus"],
  ): Promise<Order | null> {
    const existing = await this.getOrder(id);
    if (!existing) return null;
    const { data } = await this.client
      .from("orders")
      .update({
        refunds: [...existing.refunds, refund],
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();
    return data ? rowToOrder(data) : null;
  }

  async setOrderingPaused(restaurantId: string, paused: boolean): Promise<void> {
    const restaurant = await this.getRestaurantById(restaurantId);
    if (!restaurant) return;
    await this.client
      .from("restaurants")
      .update({ ordering: { ...restaurant.ordering, paused } })
      .eq("id", restaurantId);
  }

  async listOrders(restaurantId: string): Promise<Order[]> {
    const { data } = await this.client
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(rowToOrder);
  }

  async recordSms(sms: SmsRecord): Promise<void> {
    await this.client.from("sms_log").insert({
      id: sms.id,
      order_id: sms.orderId,
      to_phone: sms.to,
      body: sms.body,
      sent_at: sms.sentAt,
    });
  }

  async upsertMenuItem(restaurantId: string, item: MenuItem): Promise<void> {
    const { error } = await this.client.from("menu_items").upsert({
      id: item.id,
      restaurant_id: restaurantId,
      category_id: item.categoryId,
      name: item.name,
      description: item.description,
      price_cents: item.priceCents,
      image_url: item.imageUrl,
      sold_out: item.soldOut,
      modifier_group_ids: item.modifierGroupIds,
      sort: item.sort,
    });
    if (error) throw new Error(`upsertMenuItem failed: ${error.message}`);
  }

  async deleteMenuItem(restaurantId: string, itemId: string): Promise<void> {
    const { error } = await this.client
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("restaurant_id", restaurantId);
    if (error) throw new Error(`deleteMenuItem failed: ${error.message}`);
  }

  async updateRestaurantSettings(
    restaurantId: string,
    settings: { ordering: Restaurant["ordering"]; hours: DayHours[] },
  ): Promise<void> {
    const { error } = await this.client
      .from("restaurants")
      .update({ ordering: settings.ordering, hours: settings.hours })
      .eq("id", restaurantId);
    if (error) throw new Error(`updateRestaurantSettings failed: ${error.message}`);
  }

  async setStripeAccount(
    restaurantId: string,
    accountId: string,
    chargesEnabled: boolean,
  ): Promise<void> {
    const { error } = await this.client
      .from("restaurants")
      .update({
        stripe_account_id: accountId,
        stripe_charges_enabled: chargesEnabled,
      })
      .eq("id", restaurantId);
    if (error) throw new Error(`setStripeAccount failed: ${error.message}`);
  }

  async setCoverImage(restaurantId: string, url: string | null): Promise<void> {
    const { error } = await this.client
      .from("restaurants")
      .update({ cover_url: url })
      .eq("id", restaurantId);
    if (error) throw new Error(`setCoverImage failed: ${error.message}`);
  }

  // ── Phase 7: billing ────────────────────────────────────────────────

  async setBillingInfo(
    restaurantId: string,
    billing: Partial<Restaurant["billing"]>,
  ): Promise<void> {
    const row: Record<string, unknown> = {};
    if ("stripeCustomerId" in billing) row.stripe_customer_id = billing.stripeCustomerId;
    if ("subscriptionId" in billing) row.subscription_id = billing.subscriptionId;
    if ("tier" in billing) row.subscription_tier = billing.tier;
    if ("status" in billing) row.subscription_status = billing.status;
    if ("periodEnd" in billing) row.subscription_period_end = billing.periodEnd;
    if ("canceledAt" in billing) row.subscription_canceled_at = billing.canceledAt;
    if (Object.keys(row).length === 0) return;
    const { error } = await this.client.from("restaurants").update(row).eq("id", restaurantId);
    if (error) throw new Error(`setBillingInfo failed: ${error.message}`);
  }

  async getRestaurantByCustomerId(stripeCustomerId: string): Promise<Restaurant | null> {
    const { data } = await this.client
      .from("restaurants")
      .select("*")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();
    return data ? rowToRestaurant(data) : null;
  }

  async getRestaurantBySubscriptionId(subscriptionId: string): Promise<Restaurant | null> {
    const { data } = await this.client
      .from("restaurants")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .maybeSingle();
    return data ? rowToRestaurant(data) : null;
  }

  /** Atomic: returns true only the first time (safe against duplicate webhooks). */
  async markCancelExportSent(restaurantId: string): Promise<boolean> {
    const { data } = await this.client
      .from("restaurants")
      .update({ cancel_export_sent_at: new Date().toISOString() })
      .eq("id", restaurantId)
      .is("cancel_export_sent_at", null)
      .select("id")
      .maybeSingle();
    return Boolean(data);
  }

  async getOwnerEmail(restaurantId: string): Promise<string | null> {
    const { data: member } = await this.client
      .from("restaurant_members")
      .select("user_id")
      .eq("restaurant_id", restaurantId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    if (!member) return null;
    const { data, error } = await this.client.auth.admin.getUserById(member.user_id);
    if (error || !data.user) return null;
    return data.user.email ?? null;
  }

  // ── Phase 7: internal admin ─────────────────────────────────────────

  async listAllRestaurants(): Promise<Restaurant[]> {
    const { data } = await this.client
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []).map(rowToRestaurant);
  }

  async createRestaurant(input: NewRestaurantInput): Promise<Restaurant> {
    const id = `rest-${input.slug}`;
    const row = {
      id,
      slug: input.slug,
      name: input.name,
      tagline: { en: "", ar: "" },
      brand: { primary: "#2F4A3C", accent: "#A9792B" },
      halal: input.halal,
      phone: input.phone,
      address: input.address,
      timezone: input.timezone,
      hours: [
        { day: 0, open: "11:00", close: "21:00" },
        { day: 1, open: "11:00", close: "21:00" },
        { day: 2, open: "11:00", close: "21:00" },
        { day: 3, open: "11:00", close: "21:00" },
        { day: 4, open: "11:00", close: "21:00" },
        { day: 5, open: "11:00", close: "21:00" },
        { day: 6, open: "11:00", close: "21:00" },
      ],
      ordering: {
        pickup: true,
        delivery: false,
        deliveryFeeCents: 0,
        deliveryMinimumCents: 0,
        prepMinutes: 20,
        paused: true, // stays paused until the owner has a menu + reviews settings
      },
    };
    const { data, error } = await this.client
      .from("restaurants")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(`createRestaurant failed: ${error.message}`);
    return rowToRestaurant(data);
  }

  async createOwnerAccount(
    restaurantId: string,
    email: string,
  ): Promise<{ userId: string; temporaryPassword: string | null }> {
    const password = randomBytes(9).toString("base64url");
    const { data: created, error: createError } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    let userId: string;
    let temporaryPassword: string | null;
    if (!createError && created.user) {
      userId = created.user.id;
      temporaryPassword = password;
    } else {
      let match: { id: string } | undefined;
      for (let page = 1; page <= 10 && !match; page++) {
        const { data: list, error: listError } = await this.client.auth.admin.listUsers({
          page,
          perPage: 100,
        });
        if (listError) throw new Error(`createOwnerAccount failed: ${listError.message}`);
        match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!list.users.length) break;
      }
      if (!match) {
        throw new Error(`createOwnerAccount failed: ${createError?.message ?? "unknown error"}`);
      }
      userId = match.id;
      temporaryPassword = null;
    }

    const { error: memberError } = await this.client
      .from("restaurant_members")
      .upsert(
        { restaurant_id: restaurantId, user_id: userId, role: "owner" },
        { onConflict: "restaurant_id,user_id" },
      );
    if (memberError) throw new Error(`createOwnerAccount failed: ${memberError.message}`);

    return { userId, temporaryPassword };
  }

  async recordAuditLog(entry: Omit<AdminAuditEntry, "id" | "createdAt">): Promise<void> {
    const { error } = await this.client.from("admin_audit_log").insert({
      actor_user_id: entry.actorUserId,
      actor_email: entry.actorEmail,
      action: entry.action,
      target_restaurant_id: entry.targetRestaurantId,
      details: entry.details,
    });
    if (error) throw new Error(`recordAuditLog failed: ${error.message}`);
  }

  async listAuditLog(restaurantId?: string): Promise<AdminAuditEntry[]> {
    let query = this.client
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (restaurantId) query = query.eq("target_restaurant_id", restaurantId);
    const { data } = await query;
    return (data ?? []).map(rowToAuditEntry);
  }

  async upsertMenuCategory(restaurantId: string, category: MenuCategory): Promise<void> {
    const { error } = await this.client.from("menu_categories").upsert({
      id: category.id,
      restaurant_id: restaurantId,
      name: category.name,
      sort: category.sort,
    });
    if (error) throw new Error(`upsertMenuCategory failed: ${error.message}`);
  }

  // ── Phase 5: campaigns ────────────────────────────────────────────────

  async createCampaign(restaurantId: string, input: NewCampaignInput): Promise<Campaign> {
    const { data, error } = await this.client
      .from("campaigns")
      .insert({
        restaurant_id: restaurantId,
        channel: input.channel,
        segment: input.segment,
        subject: input.subject,
        body: input.body,
      })
      .select()
      .single();
    if (error) throw new Error(`createCampaign failed: ${error.message}`);
    return rowToCampaign(data);
  }

  async listCampaigns(restaurantId: string): Promise<Campaign[]> {
    const { data } = await this.client
      .from("campaigns")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(rowToCampaign);
  }

  async markCampaignSent(
    id: string,
    recipientCount: number,
    sentCount: number,
    failedCount: number,
  ): Promise<void> {
    const { error } = await this.client
      .from("campaigns")
      .update({
        status: "sent",
        recipient_count: recipientCount,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(`markCampaignSent failed: ${error.message}`);
  }

  // ── Phase 5: marketing opt-in ─────────────────────────────────────────

  async getMarketingOptIn(restaurantId: string, phone: string): Promise<MarketingOptIn | null> {
    const { data } = await this.client
      .from("marketing_optins")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone)
      .maybeSingle();
    return data ? rowToMarketingOptIn(data) : null;
  }

  async setMarketingOptIn(
    restaurantId: string,
    phone: string,
    patch: Partial<Pick<MarketingOptIn, "email" | "smsOptedIn" | "emailOptedIn" | "source">>,
  ): Promise<void> {
    const row: Record<string, unknown> = { restaurant_id: restaurantId, phone };
    if ("email" in patch) row.email = patch.email;
    if ("smsOptedIn" in patch) row.sms_opted_in = patch.smsOptedIn;
    if ("emailOptedIn" in patch) row.email_opted_in = patch.emailOptedIn;
    if ("source" in patch) row.source = patch.source;
    const { error } = await this.client
      .from("marketing_optins")
      .upsert(row, { onConflict: "restaurant_id,phone" });
    if (error) throw new Error(`setMarketingOptIn failed: ${error.message}`);
  }

  async unsubscribeSms(restaurantId: string, phone: string): Promise<void> {
    const { error } = await this.client
      .from("marketing_optins")
      .update({ sms_opted_in: false, unsubscribed_at: new Date().toISOString() })
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone);
    if (error) throw new Error(`unsubscribeSms failed: ${error.message}`);
  }

  async unsubscribeSmsEverywhere(phone: string): Promise<void> {
    const { error } = await this.client
      .from("marketing_optins")
      .update({ sms_opted_in: false, unsubscribed_at: new Date().toISOString() })
      .eq("phone", phone);
    if (error) throw new Error(`unsubscribeSmsEverywhere failed: ${error.message}`);
  }

  async listOptedIn(restaurantId: string, channel: "sms" | "email"): Promise<MarketingOptIn[]> {
    const column = channel === "sms" ? "sms_opted_in" : "email_opted_in";
    const { data } = await this.client
      .from("marketing_optins")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq(column, true);
    return (data ?? []).map(rowToMarketingOptIn);
  }

  // ── Phase 5: customer profile ─────────────────────────────────────────

  async getCustomerProfile(restaurantId: string, phone: string): Promise<CustomerProfile | null> {
    const { data } = await this.client
      .from("customer_profiles")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone)
      .maybeSingle();
    return data ? rowToCustomerProfile(data) : null;
  }

  async setCustomerBirthday(restaurantId: string, phone: string, birthday: string): Promise<void> {
    const { error } = await this.client
      .from("customer_profiles")
      .upsert(
        { restaurant_id: restaurantId, phone, birthday, updated_at: new Date().toISOString() },
        { onConflict: "restaurant_id,phone" },
      );
    if (error) throw new Error(`setCustomerBirthday failed: ${error.message}`);
  }

  async listBirthdaysToday(restaurantId: string, monthDay: string): Promise<CustomerProfile[]> {
    // monthDay: "MM-DD". Filtered client-side — the birthday list per
    // restaurant is small enough that an index isn't worth the complexity.
    const { data } = await this.client
      .from("customer_profiles")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .not("birthday", "is", null);
    return (data ?? [])
      .filter((row) => String(row.birthday).slice(5) === monthDay)
      .map(rowToCustomerProfile);
  }

  // ── Phase 5: offer codes ───────────────────────────────────────────────

  async createOfferCode(restaurantId: string, input: NewOfferCodeInput): Promise<OfferCode> {
    const { data, error } = await this.client
      .from("offer_codes")
      .insert({
        restaurant_id: restaurantId,
        code: input.code.trim().toUpperCase(),
        type: input.type,
        value: input.value,
        max_uses: input.maxUses,
        expires_at: input.expiresAt,
      })
      .select()
      .single();
    if (error) throw new Error(`createOfferCode failed: ${error.message}`);
    return rowToOfferCode(data);
  }

  async listOfferCodes(restaurantId: string): Promise<OfferCode[]> {
    const { data } = await this.client
      .from("offer_codes")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(rowToOfferCode);
  }

  async setOfferCodeActive(restaurantId: string, id: string, active: boolean): Promise<void> {
    const { error } = await this.client
      .from("offer_codes")
      .update({ active })
      .eq("restaurant_id", restaurantId)
      .eq("id", id);
    if (error) throw new Error(`setOfferCodeActive failed: ${error.message}`);
  }

  async validateAndRedeemOfferCode(
    restaurantId: string,
    rawCode: string,
  ): Promise<
    { ok: true; offerCode: OfferCode } | { ok: false; error: "not_found" | "expired" | "exhausted" }
  > {
    const code = rawCode.trim().toUpperCase();
    const { data } = await this.client
      .from("offer_codes")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("code", code)
      .maybeSingle();
    if (!data || !data.active) return { ok: false, error: "not_found" };
    if (data.expires_at && new Date(data.expires_at).getTime() < Date.now())
      return { ok: false, error: "expired" };
    if (data.max_uses !== null && data.use_count >= data.max_uses)
      return { ok: false, error: "exhausted" };

    // Optimistic lock on use_count — a lost race just falls through to
    // "exhausted", which is an honest outcome for a limited-use code.
    const { data: updated } = await this.client
      .from("offer_codes")
      .update({ use_count: data.use_count + 1 })
      .eq("id", data.id)
      .eq("use_count", data.use_count)
      .select()
      .maybeSingle();
    if (!updated) return { ok: false, error: "exhausted" };
    return { ok: true, offerCode: rowToOfferCode(updated) };
  }

  // ── Phase 5: loyalty ───────────────────────────────────────────────────

  async getLoyaltyAccount(restaurantId: string, phone: string): Promise<LoyaltyAccount | null> {
    const { data } = await this.client
      .from("loyalty_accounts")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone)
      .maybeSingle();
    return data ? rowToLoyaltyAccount(data) : null;
  }

  async earnLoyaltyPoints(
    restaurantId: string,
    phone: string,
    delta: number,
    reason: string,
  ): Promise<void> {
    const { data: existing } = await this.client
      .from("loyalty_accounts")
      .select("id, points")
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone)
      .maybeSingle();

    let accountId: string;
    if (existing) {
      accountId = existing.id;
      const { error } = await this.client
        .from("loyalty_accounts")
        .update({ points: existing.points + delta })
        .eq("id", accountId);
      if (error) throw new Error(`earnLoyaltyPoints failed: ${error.message}`);
    } else {
      const { data: created, error } = await this.client
        .from("loyalty_accounts")
        .insert({ restaurant_id: restaurantId, phone, points: delta })
        .select("id")
        .single();
      if (error) throw new Error(`earnLoyaltyPoints failed: ${error.message}`);
      accountId = created.id;
    }

    const { error: ledgerError } = await this.client
      .from("loyalty_ledger")
      .insert({ account_id: accountId, delta, reason });
    if (ledgerError) throw new Error(`earnLoyaltyPoints failed: ${ledgerError.message}`);
  }

  async redeemLoyaltyPoints(
    restaurantId: string,
    phone: string,
    delta: number,
    reason: string,
  ): Promise<{ ok: true } | { ok: false; error: "insufficient_points" }> {
    const { data: existing } = await this.client
      .from("loyalty_accounts")
      .select("id, points")
      .eq("restaurant_id", restaurantId)
      .eq("phone", phone)
      .maybeSingle();
    if (!existing || existing.points < delta) return { ok: false, error: "insufficient_points" };

    const { data: updated } = await this.client
      .from("loyalty_accounts")
      .update({ points: existing.points - delta })
      .eq("id", existing.id)
      .eq("points", existing.points)
      .select("id")
      .maybeSingle();
    if (!updated) return { ok: false, error: "insufficient_points" };

    const { error } = await this.client
      .from("loyalty_ledger")
      .insert({ account_id: existing.id, delta: -delta, reason });
    if (error) throw new Error(`redeemLoyaltyPoints failed: ${error.message}`);
    return { ok: true };
  }

  async setLoyaltySettings(
    restaurantId: string,
    settings: Restaurant["loyaltySettings"],
  ): Promise<void> {
    const { error } = await this.client
      .from("restaurants")
      .update({ loyalty_settings: settings })
      .eq("id", restaurantId);
    if (error) throw new Error(`setLoyaltySettings failed: ${error.message}`);
  }

  // ── Phase 5: automations ───────────────────────────────────────────────

  async setAutomationSettings(
    restaurantId: string,
    settings: Restaurant["automations"],
  ): Promise<void> {
    const { error } = await this.client
      .from("restaurants")
      .update({ automations: settings })
      .eq("id", restaurantId);
    if (error) throw new Error(`setAutomationSettings failed: ${error.message}`);
  }

  async tryRecordAutomation(
    restaurantId: string,
    kind: AutomationKind,
    phone: string,
    ref: string,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("automation_log")
      .insert({ restaurant_id: restaurantId, kind, phone, ref })
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.code === "23505") return false; // unique violation — already sent
      throw new Error(`tryRecordAutomation failed: ${error.message}`);
    }
    return Boolean(data);
  }

  // ── Phase 8B: demo reset ───────────────────────────────────────────────

  async resetDemoRestaurant(): Promise<void> {
    const id = beitZizo.id; // hard-scoped: only ever the seeded demo tenant

    // 1. Wipe transactional/demo-session data. loyalty_ledger cascades
    // from loyalty_accounts; menu_items cascade from menu_categories.
    const wipeTables = [
      "orders",
      "sms_log",
      "loyalty_accounts",
      "campaigns",
      "marketing_optins",
      "customer_profiles",
      "automation_log",
      "offer_codes",
      "menu_items",
      "menu_categories",
      "modifier_groups",
    ];
    for (const table of wipeTables) {
      const { error } = await this.client.from(table).delete().eq("restaurant_id", id);
      if (error) throw new Error(`resetDemoRestaurant wipe ${table} failed: ${error.message}`);
    }

    // 2. Restore the restaurant's content fields from the seed — but never
    // touch billing/Stripe columns; those are infrastructure, not demo data.
    const { error: restaurantError } = await this.client
      .from("restaurants")
      .update({
        name: beitZizo.name,
        tagline: beitZizo.tagline,
        logo_url: beitZizo.logoUrl,
        cover_url: beitZizo.coverUrl,
        brand: beitZizo.brand,
        halal: beitZizo.halal,
        phone: beitZizo.phone,
        address: beitZizo.address,
        timezone: beitZizo.timezone,
        hours: beitZizo.hours,
        instagram_url: beitZizo.instagramUrl,
        google_reviews_url: beitZizo.googleReviewsUrl,
        ordering: beitZizo.ordering,
        loyalty_settings: beitZizo.loyaltySettings,
        automations: beitZizo.automations,
      })
      .eq("id", id);
    if (restaurantError)
      throw new Error(`resetDemoRestaurant restaurant failed: ${restaurantError.message}`);

    // 3. Reseed the menu.
    const { error: catError } = await this.client.from("menu_categories").insert(
      beitZizoMenu.categories.map((c) => ({
        id: c.id,
        restaurant_id: id,
        name: c.name,
        sort: c.sort,
      })),
    );
    if (catError) throw new Error(`resetDemoRestaurant categories failed: ${catError.message}`);

    const { error: groupError } = await this.client.from("modifier_groups").insert(
      beitZizoMenu.modifierGroups.map((g) => ({
        id: g.id,
        restaurant_id: id,
        name: g.name,
        min: g.min,
        max: g.max,
        options: g.options,
      })),
    );
    if (groupError) throw new Error(`resetDemoRestaurant groups failed: ${groupError.message}`);

    const { error: itemError } = await this.client.from("menu_items").insert(
      beitZizoMenu.items.map((i) => ({
        id: i.id,
        restaurant_id: id,
        category_id: i.categoryId,
        name: i.name,
        description: i.description,
        price_cents: i.priceCents,
        image_url: i.imageUrl,
        sold_out: i.soldOut,
        modifier_group_ids: i.modifierGroupIds,
        sort: i.sort,
      })),
    );
    if (itemError) throw new Error(`resetDemoRestaurant items failed: ${itemError.message}`);
  }

  // ── Directory (/eat) ───────────────────────────────────────────────────

  async listDirectory(city: string): Promise<DirectoryListing[]> {
    const { data } = await this.client
      .from("directory_listings")
      .select("*")
      .eq("city", city)
      .order("name");
    return (data ?? []).map(rowToDirectoryListing);
  }

  async getDirectoryListing(city: string, slug: string): Promise<DirectoryListing | null> {
    const { data } = await this.client
      .from("directory_listings")
      .select("*")
      .eq("city", city)
      .eq("slug", slug)
      .maybeSingle();
    return data ? rowToDirectoryListing(data) : null;
  }

  async listDirectoryReviewQueue(): Promise<DirectoryListing[]> {
    const { data } = await this.client
      .from("directory_listings")
      .select("*")
      .eq("published", false)
      .order("city")
      .order("name");
    return (data ?? []).map(rowToDirectoryListing);
  }

  async setDirectoryPublished(id: string, published: boolean): Promise<void> {
    const { error } = await this.client
      .from("directory_listings")
      .update({ published })
      .eq("id", id);
    if (error) throw new Error(`setDirectoryPublished failed: ${error.message}`);
  }

  async deleteDirectoryListing(id: string): Promise<void> {
    const { error } = await this.client.from("directory_listings").delete().eq("id", id);
    if (error) throw new Error(`deleteDirectoryListing failed: ${error.message}`);
  }

  async getDirectoryListingByRestaurant(restaurantId: string): Promise<DirectoryListing | null> {
    const { data } = await this.client
      .from("directory_listings")
      .select("*")
      .eq("claimed_restaurant_id", restaurantId)
      .maybeSingle();
    return data ? rowToDirectoryListing(data) : null;
  }

  async setDirectoryBlurb(id: string, blurb: string | null, blurbAr: string | null): Promise<void> {
    const { error } = await this.client
      .from("directory_listings")
      .update({ custom_blurb: blurb, custom_blurb_ar: blurbAr })
      .eq("id", id);
    if (error) throw new Error(`setDirectoryBlurb failed: ${error.message}`);
  }

  // ── Concierge requests (docs/concierge-requests-spec.md) ──────────────

  async createServiceRequest(
    input: Omit<ServiceRequest, "id" | "status" | "reply" | "ownerReply" | "createdAt" | "updatedAt" | "completedAt">,
  ): Promise<ServiceRequest> {
    const { data, error } = await this.client
      .from("service_requests")
      .insert({
        restaurant_id: input.restaurantId,
        category: input.category,
        target: input.target,
        kind: input.kind,
        note: input.note,
        note_locale: input.noteLocale,
        voice_url: input.voiceUrl,
        photo_url: input.photoUrl,
        pricing_flag: input.pricingFlag,
      })
      .select("*")
      .single();
    if (error) throw new Error(`createServiceRequest failed: ${error.message}`);
    return rowToServiceRequest(data);
  }

  async listServiceRequests(restaurantId: string): Promise<ServiceRequest[]> {
    const { data } = await this.client
      .from("service_requests")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(rowToServiceRequest);
  }

  async listAllServiceRequests(): Promise<ServiceRequest[]> {
    const { data } = await this.client
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map(rowToServiceRequest);
    // open requests first (oldest open on top — that's the SLA clock)
    const open = rows.filter((r) => r.status !== "done").reverse();
    const done = rows.filter((r) => r.status === "done");
    return [...open, ...done];
  }

  async getServiceRequest(id: string): Promise<ServiceRequest | null> {
    const { data } = await this.client
      .from("service_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data ? rowToServiceRequest(data) : null;
  }

  async updateServiceRequest(
    id: string,
    patch: Partial<Pick<ServiceRequest, "status" | "reply" | "ownerReply" | "completedAt">>,
  ): Promise<void> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.reply !== undefined) row.reply = patch.reply;
    if (patch.ownerReply !== undefined) row.owner_reply = patch.ownerReply;
    if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;
    const { error } = await this.client.from("service_requests").update(row).eq("id", id);
    if (error) throw new Error(`updateServiceRequest failed: ${error.message}`);
  }

  // ── Phase 8C: order funnel ─────────────────────────────────────────────

  async recordStorefrontEvent(
    restaurantId: string,
    sessionHash: string,
    step: FunnelStep,
  ): Promise<void> {
    const { error } = await this.client
      .from("storefront_events")
      .insert({ restaurant_id: restaurantId, session_hash: sessionHash, step });
    // Analytics must never break a storefront page — log and move on.
    if (error) console.error(`[funnel] record failed: ${error.message}`);
  }

  async getFunnelCounts(restaurantId: string, sinceDays: number): Promise<FunnelCounts> {
    const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
    const { data } = await this.client
      .from("storefront_events")
      .select("session_hash, step")
      .eq("restaurant_id", restaurantId)
      .gte("created_at", since)
      .limit(20_000);
    const distinct = { view: new Set<string>(), add_to_cart: new Set<string>(), checkout_start: new Set<string>() };
    for (const row of data ?? []) {
      distinct[row.step as FunnelStep]?.add(row.session_hash);
    }
    return {
      views: distinct.view.size,
      carts: distinct.add_to_cart.size,
      checkouts: distinct.checkout_start.size,
    };
  }
}
