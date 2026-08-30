import { NextResponse } from "next/server";
import { placeMobileOrder, type PlaceOrderInput } from "@/lib/orders/place-order";
import { isExpoPushToken } from "@/lib/push/expo";
import { requestOrigin } from "@/lib/mobile/api";
import { allowRequest } from "@/lib/rate-limit";

/**
 * Native-app order placement (docs/mobile-app-spec.md §3). Same
 * rate-limit budget as the web placeOrderAction — the app is just
 * another client, no special-cased trust. All validation and pricing
 * happen inside placeMobileOrder (shared with web); this route only
 * shapes the transport.
 */
export async function POST(request: Request) {
  if (!(await allowRequest("place-order", 10))) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts — wait a minute and try again" },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Field-by-field pickup: never spread unknown client JSON into the input.
  const input: PlaceOrderInput = {
    restaurantSlug: String(body.restaurantSlug ?? ""),
    locale: body.locale === "ar" ? "ar" : "en",
    fulfillment: body.fulfillment === "delivery" ? "delivery" : "pickup",
    scheduledFor: typeof body.scheduledFor === "string" ? body.scheduledFor : null,
    customer: {
      name: String((body.customer as Record<string, unknown> | undefined)?.name ?? ""),
      phone: String((body.customer as Record<string, unknown> | undefined)?.phone ?? ""),
      smsOptIn: Boolean((body.customer as Record<string, unknown> | undefined)?.smsOptIn),
    },
    deliveryAddress: typeof body.deliveryAddress === "string" ? body.deliveryAddress : null,
    tipCents: typeof body.tipCents === "number" ? body.tipCents : 0,
    offerCode: typeof body.offerCode === "string" ? body.offerCode : null,
    redeemRewardId: typeof body.redeemRewardId === "string" ? body.redeemRewardId : null,
    lines: Array.isArray(body.lines)
      ? (body.lines as PlaceOrderInput["lines"]).map((line) => ({
          menuItemId: String(line.menuItemId ?? ""),
          qty: Number(line.qty ?? 0),
          options:
            line.options && typeof line.options === "object"
              ? Object.fromEntries(
                  Object.entries(line.options).map(([k, v]) => [
                    k,
                    Array.isArray(v) ? v.map(String) : [],
                  ]),
                )
              : {},
          notes: typeof line.notes === "string" ? line.notes : null,
        }))
      : [],
    pushToken:
      typeof body.pushToken === "string" && isExpoPushToken(body.pushToken)
        ? body.pushToken
        : null,
  };

  try {
    const result = await placeMobileOrder(input, requestOrigin(request));
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    // Same diner-facing contract as validation failures — never leak a
    // stack or raw driver message to the app.
    console.error("[mobile] place order failed", err);
    return NextResponse.json(
      { ok: false, error: "Something went wrong — please try again" },
      { status: 500 },
    );
  }
}
