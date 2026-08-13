import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";
import { alertOverdueOrders } from "@/lib/orders/lifecycle";

/**
 * Live orders feed for the kitchen board (polled every few seconds).
 * Piggybacks the unaccepted-order check so overdue alerts fire even with
 * no cron in local dev. NOTE: unauthenticated until Phase 4 auth lands.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const origin = request.nextUrl.origin;
  await alertOverdueOrders(restaurant, origin);

  const orders = await store.listOrders(restaurant.id);
  const active = orders.filter(
    (o) => o.status !== "completed" && o.status !== "canceled",
  );
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = orders.filter(
    (o) =>
      (o.status === "completed" || o.status === "canceled") &&
      o.createdAt.startsWith(today),
  );
  return NextResponse.json({ active, doneToday });
}
