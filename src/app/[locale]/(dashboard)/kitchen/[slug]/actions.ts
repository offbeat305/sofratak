"use server";

import { advanceOrderStatus } from "@/lib/orders/lifecycle";
import type { OrderStatus } from "@/lib/db/types";

export async function advanceStatusAction(orderId: string, to: OrderStatus) {
  return advanceOrderStatus(orderId, to);
}
