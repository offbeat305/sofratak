"use client";

import { useEffect, useRef, useState } from "react";
import { getListingEnrichmentAction } from "@/app/[locale]/(marketing)/eat/actions";

/**
 * Lazy live Google photo for unclaimed listing CARDS (Zizo: photos on
 * all cards — claimed vs unclaimed reads through Order Now / Verified /
 * placement, not photo presence). Fetches only when the card scrolls
 * into view so a metro page doesn't burn the Places daily cap up front;
 * when the cap is hit (action returns null) the card just stays plain.
 * Same ToS rules as the detail gallery: live fetch through the key-less
 * proxy, plain <img>, tiny Google attribution overlay, nothing stored.
 */
export function CardPhoto({ city, slug }: { city: string; slug: string }) {
  const holder = useRef<HTMLDivElement | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || requested.current) return;
        requested.current = true;
        observer.disconnect();
        getListingEnrichmentAction(city, slug).then((data) => {
          if (data?.photoNames?.length) setPhotoName(data.photoNames[0]);
        });
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [city, slug]);

  return (
    // Plain state is a zero-size sentinel, NOT display:none — hidden
    // elements have no box and never intersect, so the photo would never
    // load. The -me-4 cancels the parent's gap-4 while the card is plain.
    <div
      ref={holder}
      className={
        photoName
          ? "relative size-24 shrink-0 overflow-hidden rounded-2xl"
          : "size-0 shrink-0 -me-4"
      }
    >
      {photoName && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- live Places photo, must never touch next/image's cache */}
          <img
            src={`/api/eat/photo?name=${encodeURIComponent(photoName)}`}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
          <span className="absolute bottom-0.5 end-1 rounded bg-charcoal/55 px-1 text-[9px] font-medium text-white">
            Google
          </span>
        </>
      )}
    </div>
  );
}
