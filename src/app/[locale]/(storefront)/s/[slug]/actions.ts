"use server";

import { headers } from "next/headers";
import {
  placeOrder,
  type PlaceOrderInput,
  type PlaceOrderResult,
} from "@/lib/orders/place-order";

export async function placeOrderAction(
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return placeOrder(input, `${proto}://${host}`);
}
