import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db/store";
import { getMembership } from "@/lib/auth/server";
import { alertOverdueOrders } from "@/lib/orders/lifecycle";

/**
 * Live orders feed for the kitchen board (polled every few seconds).
 * Piggybacks the unaccepted-order check so overdue alerts fire even with
 * no cron in local dev. Members only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const membership = await getMembership(slug);
  if (!membership)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { restaurant } = membership;
  const store = getStore();

  const origin = request.nextUrl.origin;
  await alertOverdueOrders(restaurant, origin);

  // Pending-payment orders never reach the kitchen — paid only.
  const orders = (await store.listOrders(restaurant.id)).filter(
    (o) => o.paymentStatus !== "pending",
  );
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
