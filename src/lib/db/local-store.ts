import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { DataStore } from "./store";
import type {
  AdminAuditEntry,
  Menu,
  Order,
  OrderRefund,
  OrderStatus,
  Restaurant,
  SmsRecord,
} from "./types";
import { beitZizo, beitZizoMenu } from "./seed/beit-zizo";

type StoreData = {
  restaurants: Restaurant[];
  menus: Record<string, Menu>;
  orders: Order[];
  sms: SmsRecord[];
};

const DATA_FILE = path.join(process.cwd(), ".data", "store.json");

function seedData(): StoreData {
  return {
    restaurants: [beitZizo],
    menus: { [beitZizo.id]: beitZizoMenu },
    orders: [],
    sms: [],
  };
}

/**
 * Dev-only JSON-file store. Orders/SMS persist to .data/store.json;
 * restaurant + menu always come fresh from the seed so seed edits show up
 * without deleting the file.
 *
 * No in-memory caching: Next.js dev compiles route handlers and server
 * actions into separate module graphs, so several LocalStore instances
 * coexist — the file is the single source of truth.
 */
export class LocalStore implements DataStore {
  private data: StoreData | null = null;
  private writing: Promise<void> = Promise.resolve();

  private async load(): Promise<StoreData> {
    try {
      const raw = await fs.readFile(DATA_FILE, "utf8");
      const saved = JSON.parse(raw) as Partial<StoreData>;
      const orders = (saved.orders ?? []).map((o) => ({
        ...o,
        refunds: o.refunds ?? [],
      }));
      this.data = { ...seedData(), orders, sms: saved.sms ?? [] };
    } catch {
      this.data = seedData();
    }
    try {
      const flags: Record<string, boolean> = JSON.parse(
        await fs.readFile(path.join(process.cwd(), ".data", "paused.json"), "utf8"),
      );
      for (const restaurant of this.data.restaurants) {
        if (flags[restaurant.id] !== undefined) {
          restaurant.ordering.paused = flags[restaurant.id];
        }
      }
    } catch {
      // no pause overrides
    }
    return this.data;
  }

  private persist(): void {
    const snapshot = JSON.stringify(
      { orders: this.data?.orders ?? [], sms: this.data?.sms ?? [] },
      null,
      2,
    );
    this.writing = this.writing.then(async () => {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, snapshot, "utf8");
    });
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
    const data = await this.load();
    return data.restaurants.find((r) => r.slug === slug) ?? null;
  }

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    const data = await this.load();
    return data.restaurants.find((r) => r.id === id) ?? null;
  }

  async markOrderPaid(id: string, paymentRef: string): Promise<Order | null> {
    const data = await this.load();
    const order = data.orders.find((o) => o.id === id);
    if (!order || order.paymentStatus !== "pending") return null;
    order.paymentStatus = "paid";
    order.paymentRef = paymentRef;
    order.updatedAt = new Date().toISOString();
    this.persist();
    return order;
  }

  async addOrderRefund(
    id: string,
    refund: OrderRefund,
    paymentStatus: Order["paymentStatus"],
  ): Promise<Order | null> {
    const data = await this.load();
    const order = data.orders.find((o) => o.id === id);
    if (!order) return null;
    order.refunds.push(refund);
    order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();
    this.persist();
    return order;
  }

  async setOrderingPaused(restaurantId: string, paused: boolean): Promise<void> {
    // The local store re-seeds restaurants each load, so pause state lives
    // in a side file that seedData() reads — good enough for dev.
    const flagFile = path.join(process.cwd(), ".data", "paused.json");
    let flags: Record<string, boolean> = {};
    try {
      flags = JSON.parse(await fs.readFile(flagFile, "utf8"));
    } catch {
      // first write
    }
    flags[restaurantId] = paused;
    await fs.mkdir(path.dirname(flagFile), { recursive: true });
    await fs.writeFile(flagFile, JSON.stringify(flags), "utf8");
  }

  async markUnacceptedAlert(id: string): Promise<void> {
    const data = await this.load();
    const order = data.orders.find((o) => o.id === id);
    if (order) {
      order.unacceptedAlertSentAt = new Date().toISOString();
      this.persist();
    }
  }

  async getMenu(restaurantId: string): Promise<Menu | null> {
    const data = await this.load();
    return data.menus[restaurantId] ?? null;
  }

  async createOrder(order: Order): Promise<void> {
    const data = await this.load();
    data.orders.push(order);
    this.persist();
  }

  async getOrder(id: string): Promise<Order | null> {
    const data = await this.load();
    return data.orders.find((o) => o.id === id) ?? null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const data = await this.load();
    const order = data.orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.persist();
    return order;
  }

  async listOrders(restaurantId: string): Promise<Order[]> {
    const data = await this.load();
    return data.orders
      .filter((o) => o.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async recordSms(sms: SmsRecord): Promise<void> {
    const data = await this.load();
    data.sms.push(sms);
    this.persist();
  }

  // The local store re-seeds menus/restaurants each load; edits belong to
  // the Supabase backend, which is primary since 2026-08-13.
  async upsertMenuItem(): Promise<void> {
    throw new Error("Menu editing requires the Supabase backend");
  }

  async deleteMenuItem(): Promise<void> {
    throw new Error("Menu editing requires the Supabase backend");
  }

  async updateRestaurantSettings(): Promise<void> {
    throw new Error("Settings editing requires the Supabase backend");
  }

  async setStripeAccount(): Promise<void> {
    throw new Error("Stripe Connect requires the Supabase backend");
  }

  async setBillingInfo(): Promise<void> {
    throw new Error("Billing requires the Supabase backend");
  }

  async getRestaurantByCustomerId(): Promise<Restaurant | null> {
    throw new Error("Billing requires the Supabase backend");
  }

  async getRestaurantBySubscriptionId(): Promise<Restaurant | null> {
    throw new Error("Billing requires the Supabase backend");
  }

  async markCancelExportSent(): Promise<boolean> {
    throw new Error("Billing requires the Supabase backend");
  }

  async getOwnerEmail(): Promise<string | null> {
    throw new Error("Billing requires the Supabase backend");
  }

  async listAllRestaurants(): Promise<Restaurant[]> {
    const data = await this.load();
    return data.restaurants;
  }

  async createRestaurant(): Promise<Restaurant> {
    throw new Error("Onboarding requires the Supabase backend");
  }

  async createOwnerAccount(): Promise<{ userId: string; temporaryPassword: string | null }> {
    throw new Error("Onboarding requires the Supabase backend");
  }

  async recordAuditLog(): Promise<void> {
    throw new Error("Audit log requires the Supabase backend");
  }

  async listAuditLog(): Promise<AdminAuditEntry[]> {
    return [];
  }

  async upsertMenuCategory(): Promise<void> {
    throw new Error("Menu editing requires the Supabase backend");
  }
}
