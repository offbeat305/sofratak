import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { DataStore } from "./store";
import type { Menu, Order, OrderStatus, Restaurant, SmsRecord } from "./types";
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
      this.data = { ...seedData(), orders: saved.orders ?? [], sms: saved.sms ?? [] };
    } catch {
      this.data = seedData();
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
}
