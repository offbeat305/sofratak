"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/db/store";
import { refundOrder, type RefundRequest } from "@/lib/orders/refunds";

export async function setPausedAction(slug: string, paused: boolean) {
  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) return { ok: false as const, error: "Not found" };
  await getStore().setOrderingPaused(restaurant.id, paused);
  revalidatePath(`/[locale]/dashboard/${slug}`, "layout");
  return { ok: true as const };
}

export async function refundOrderAction(orderId: string, request: RefundRequest) {
  return refundOrder(orderId, request);
}
