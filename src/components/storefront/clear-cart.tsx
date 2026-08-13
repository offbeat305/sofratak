"use client";

import { useEffect } from "react";

/**
 * Rendered on the order page once an order is paid: the cart survives the
 * round-trip to Stripe (so a canceled payment loses nothing), then clears
 * here on success.
 */
export function ClearCart({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      window.localStorage.removeItem(`sofratak-cart-${slug}`);
    } catch {
      // storage unavailable — nothing to clear
    }
  }, [slug]);
  return null;
}
