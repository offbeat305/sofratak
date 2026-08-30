import Constants from "expo-constants";
import type {
  OrderView,
  PlaceOrderRequest,
  PlaceOrderResponse,
  RestaurantSummary,
  StorefrontResponse,
} from "./types";

/**
 * Base URL resolution: EXPO_PUBLIC_API_URL wins (set it to your LAN IP for
 * device testing, e.g. http://192.168.1.234:3000), then app.json extra,
 * then the Expo dev-server host with port 3000 (simulator + `next dev` on
 * the same machine), then production.
 */
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  if (fromExtra) return fromExtra.replace(/\/$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (host) return `http://${host}:3000`;
  return "https://www.sofratak.com";
}

export const API_BASE = resolveBaseUrl();

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new ApiError(`GET ${path} → ${res.status}`, res.status);
  return (await res.json()) as T;
}

export async function fetchRestaurants(): Promise<RestaurantSummary[]> {
  const data = await getJson<{ restaurants: RestaurantSummary[] }>("/api/mobile/restaurants");
  return data.restaurants;
}

export async function fetchStorefront(slug: string): Promise<StorefrontResponse> {
  return getJson<StorefrontResponse>(`/api/mobile/storefront/${encodeURIComponent(slug)}`);
}

export async function placeOrder(input: PlaceOrderRequest): Promise<PlaceOrderResponse> {
  const res = await fetch(`${API_BASE}/api/mobile/orders`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(input),
  });
  // Non-2xx still carries {ok:false,error} JSON — surface that message.
  try {
    return (await res.json()) as PlaceOrderResponse;
  } catch {
    return { ok: false, error: `Request failed (${res.status})` };
  }
}

export type LoyaltyStatus = {
  punches: number;
  rewards: Array<{
    id: string;
    name: { en: string; ar: string };
    punchesNeeded: number;
    valueCents: number;
  }>;
} | null;

export async function fetchLoyalty(restaurantSlug: string, phone: string): Promise<LoyaltyStatus> {
  const res = await fetch(`${API_BASE}/api/mobile/loyalty`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ restaurantSlug, phone }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { loyalty: LoyaltyStatus };
  return data.loyalty;
}

export async function fetchOrder(orderId: string): Promise<OrderView> {
  const data = await getJson<{ order: OrderView }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}`,
  );
  return data.order;
}

export async function confirmOrder(
  orderId: string,
): Promise<{ order: OrderView; paid: boolean }> {
  const res = await fetch(`${API_BASE}/api/mobile/orders/${encodeURIComponent(orderId)}/confirm`, {
    method: "POST",
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new ApiError(`confirm → ${res.status}`, res.status);
  return (await res.json()) as { order: OrderView; paid: boolean };
}
