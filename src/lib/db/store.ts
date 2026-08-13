import "server-only";
import type { Menu, Order, OrderStatus, Restaurant, SmsRecord } from "./types";
import { LocalStore } from "./local-store";

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
  listOrders(restaurantId: string): Promise<Order[]>;
  recordSms(sms: SmsRecord): Promise<void>;
}

let store: DataStore | null = null;

/**
 * Local JSON store until Supabase credentials exist (see CLAUDE.md
 * "Local dev fallbacks"). The Supabase implementation will slot in here,
 * selected by SUPABASE_URL — no call sites change.
 */
export function getStore(): DataStore {
  if (process.env.SUPABASE_URL) {
    throw new Error(
      "Supabase store not implemented yet — remove SUPABASE_URL or implement src/lib/db/supabase-store.ts (migrations are ready in /supabase/migrations).",
    );
  }
  store ??= new LocalStore();
  return store;
}
