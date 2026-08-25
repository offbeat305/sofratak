"use client";

import { useEffect, useRef, useState } from "react";
import { getListingEnrichmentAction } from "@/app/[locale]/(marketing)/eat/actions";
import type { LiveEnrichment } from "@/lib/eat/places-live";

/**
 * Lazy live-Places enrichment for a listing, fetched only once the
 * attached element scrolls near the viewport (design-pass-2: result
 * rows show live rating + summary + photo without burning the daily
 * cap on off-screen rows). `enabled=false` (claimed listings, no
 * place_id) never fetches. `status` drives the skeleton state:
 * "loading" until the action resolves, then "done" (data may still be
 * null — cap hit or no Google match → designed fallback, never a gray
 * box).
 */
export function useListingEnrichment(city: string, slug: string, enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  const requested = useRef(false);
  const [data, setData] = useState<LiveEnrichment | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done">(
    enabled ? "idle" : "done",
  );

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || requested.current) return;
        requested.current = true;
        observer.disconnect();
        setStatus("loading");
        getListingEnrichmentAction(city, slug).then((result) => {
          setData(result);
          setStatus("done");
        });
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [city, slug, enabled]);

  return { ref, data, status };
}
