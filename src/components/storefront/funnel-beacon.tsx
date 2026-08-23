"use client";

import { useEffect } from "react";
import { recordFunnelEventAction } from "@/app/[locale]/(storefront)/s/[slug]/actions";

/** Stable anonymous id per browser per restaurant — a random uuid, no PII. */
export function funnelSessionId(slug: string): string {
  const key = `sofratak-fs-${slug}`;
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

/** Fire an event at most once per page load; server dedupes by session anyway. */
export function fireFunnelEvent(slug: string, step: "view" | "add_to_cart" | "checkout_start"): void {
  try {
    void recordFunnelEventAction(slug, step, funnelSessionId(slug));
  } catch {
    // analytics never surfaces to the diner
  }
}

/** Mounts silently on a storefront page and records one funnel step. */
export function FunnelBeacon({
  slug,
  step,
}: {
  slug: string;
  step: "view" | "checkout_start";
}) {
  useEffect(() => {
    fireFunnelEvent(slug, step);
  }, [slug, step]);
  return null;
}
