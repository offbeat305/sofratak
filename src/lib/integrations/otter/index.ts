import "server-only";
import type { Order, Restaurant } from "@/lib/db/types";

/**
 * Otter POS integration boundary (CLAUDE.md): nothing outside this module
 * imports Otter directly. Partner application is pending — until API access
 * lands, only the mock ships. When it's approved, implement OtterClient
 * against the real API and flip the factory; call sites don't change.
 */
export interface OtterClient {
  /** Push an order into the restaurant's Otter-connected POS. */
  submitOrder(order: Order, restaurant: Restaurant): Promise<{ ok: boolean }>;
}

class MockOtterClient implements OtterClient {
  async submitOrder(order: Order) {
    console.log(`[otter:mock] would submit order ${order.number}`);
    return { ok: true };
  }
}

export function getOtterClient(): OtterClient {
  return new MockOtterClient();
}
