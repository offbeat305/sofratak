"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EatListingView } from "./types";

/**
 * Directory map — Leaflet + OSM tiles (free tier, no key). Sofratak
 * brand pins per the spec: verified = larger filled brass, unclaimed =
 * small olive outline. Loaded only on the client (dynamic import in the
 * city view).
 */
export default function EatMap({
  listings,
  center,
  zoom,
  selectedId,
  onSelect,
}: {
  listings: EatListingView[];
  center: { lat: number; lng: number };
  zoom: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
        [center.lat, center.lng],
        zoom,
      );
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      for (const listing of listings) {
        if (listing.lat === null || listing.lng === null) continue;
        const marker = L.circleMarker([listing.lat, listing.lng], {
          radius: listing.verified ? 11 : 6,
          color: listing.verified ? "#a9792b" : "#2f4a3c",
          weight: 2,
          fillColor: listing.verified ? "#a9792b" : "#f7f2e8",
          fillOpacity: listing.verified ? 0.9 : 0.6,
        }).addTo(map);
        marker.bindTooltip(listing.name, { direction: "top", offset: [0, -6] });
        marker.on("click", () => onSelect(listing.id));
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The listing set for a city page is stable per render — rebuilding the
    // map on selection changes would be wasteful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to the selected listing when the list drives the map.
  useEffect(() => {
    if (!selectedId || !mapRef.current) return;
    const listing = listings.find((l) => l.id === selectedId);
    if (listing?.lat != null && listing.lng != null) {
      mapRef.current.setView([listing.lat, listing.lng], 15, { animate: true });
    }
  }, [selectedId, listings]);

  return <div ref={containerRef} className="h-full w-full" aria-hidden />;
}
