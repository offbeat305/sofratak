import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { DataStore } from "./store";
import type {
  DayHours,
  Menu,
  MenuCategory,
  MenuItem,
  ModifierGroup,
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
}
