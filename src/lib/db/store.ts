import "server-only";
import type {
  DayHours,
  Menu,
  MenuItem,
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
