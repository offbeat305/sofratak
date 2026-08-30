import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { orderPublicView } from "@/lib/mobile/api";
import { allowRequest } from "@/lib/rate-limit";

/**
 * Order status poll. Authz model is identical to the web status page:
 * possession of the unguessable order UUID is the credential (guest
 * checkout, no accounts in v1). Polled every few seconds while the
 * status screen is open, hence the generous-but-present rate limit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  if (!(await allowRequest("mobile-order-status", 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const { orderId } = await params;
  const order = await getStore().getOrder(orderId);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ order: orderPublicView(order) });
}
