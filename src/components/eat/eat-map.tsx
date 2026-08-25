"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EatListingView } from "./types";

/**
 * Directory map (design-pass-2 A1/B): Carto Positron light tiles —
 * clean and desaturated so the olive/brass pins carry the brand.
 * Numbered divIcon pins match the numbered result rows; claimed rows
 * get the larger brass pin. Hovering a row pulses its pin
 * (`hoveredId`), clicking a pin scrolls to + flashes its row
 * (`onPinClick`). Free tier, no key.
 */
export default function EatMap({
  listings,
  center,
  zoom,
  hoveredId,
  flyToId,
  onPinClick,
}: {
  /** in display order — pin numbers are index+1 */
  listings: EatListingView[];
  center: { lat: number; lng: number };
  zoom: number;
  hoveredId: string | null;
  /** mobile carousel drives the map here; null on desktop (no jumpiness) */
  flyToId: string | null;
  onPinClick: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef(new Map<string, Marker>());
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  // (Re)build markers when the display order changes — numbers must
  // track the sorted/filtered list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
          [center.lat, center.lng],
          zoom,
        );
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 20,
          subdomains: "abcd",
        }).addTo(mapRef.current);
      }

      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();

      listings.forEach((listing, i) => {
        if (listing.lat === null || listing.lng === null) return;
        const marker = L.marker([listing.lat, listing.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div class="sf-pin${listing.verified ? " sf-pin-claimed" : ""}" data-listing="${listing.id}">${i + 1}</div>`,
            iconSize: listing.verified ? [30, 30] : [26, 26],
            iconAnchor: listing.verified ? [15, 15] : [13, 13],
          }),
          // claimed pins stack above the olive ones, active handled via CSS
          zIndexOffset: listing.verified ? 500 : 0,
        }).addTo(mapRef.current!);
        marker.bindTooltip(listing.name, { direction: "top", offset: [0, -12] });
        marker.on("click", () => onPinClickRef.current(listing.id));
        markersRef.current.set(listing.id, marker);
      });
    })();
    return () => {
      cancelled = true;
    };
    // center/zoom are static per metro page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
    },
    [],
  );

  // Row hover ↔ pin pulse (both directions handled by the parent state).
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const el = marker.getElement()?.querySelector(".sf-pin");
      if (!el) continue;
      el.classList.toggle("sf-pin-active", id === hoveredId);
    }
  }, [hoveredId, listings]);

  useEffect(() => {
    if (!flyToId || !mapRef.current) return;
    const listing = listings.find((l) => l.id === flyToId);
    if (listing?.lat != null && listing.lng != null) {
      mapRef.current.panTo([listing.lat, listing.lng], { animate: true });
    }
  }, [flyToId, listings]);

  return <div ref={containerRef} className="h-full w-full" aria-hidden />;
}
