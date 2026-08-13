"use server";

import { getStore } from "@/lib/db/store";
import { getMembershipByRestaurantId } from "@/lib/auth/server";
import { advanceOrderStatus } from "@/lib/orders/lifecycle";
import type { OrderStatus } from "@/lib/db/types";

export async function advanceStatusAction(orderId: string, to: OrderStatus) {
  const order = await getStore().getOrder(orderId);
  if (!order) return { ok: false as const, error: "Order not found" };
  if (!(await getMembershipByRestaurantId(order.restaurantId)))
    return { ok: false as const, error: "Unauthorized" };
  return advanceOrderStatus(orderId, to);
}
