"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ListingPlaceholder } from "./listing-placeholder";
import { useListingEnrichment } from "./use-listing-enrichment";
import type { EatListingView } from "./types";

/**
 * "More Arab restaurants nearby" rail (design-pass-2 A2): horizontal
 * snap-scroll of the 6 closest same-metro listings — keeps people
 * browsing the directory the way Yelp does.
 */
export function NearbyRail({ city, listings }: { city: string; listings: EatListingView[] }) {
  const t = useTranslations("site.eat");
  if (listings.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-olive">{t("sectionMoreTitle")}</h2>
      <div className="-mx-4 mt-3 snap-x snap-mandatory overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-3 pb-1">
          {listings.map((l) => (
            <NearbyCard key={l.id} city={city} listing={l} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NearbyCard({ city, listing }: { city: string; listing: EatListingView }) {
  const t = useTranslations("site.eat");
  const { ref, data, status } = useListingEnrichment(city, listing.slug, listing.hasLivePhotos);
  const photoName = data?.photoNames?.[0] ?? null;

  return (
    <Link
      ref={ref as React.RefObject<HTMLAnchorElement>}
      href={`/eat/${city}/${listing.slug}`}
      className="card-crisp hover-lift w-44 shrink-0 snap-start overflow-hidden rounded-card bg-white"
    >
      <div className="relative h-28">
        {status === "loading" ? (
          <div className="skeleton absolute inset-0" />
        ) : photoName ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- live Places photo, never next/image */}
            <img
              src={`/api/eat/photo?name=${encodeURIComponent(photoName)}`}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="absolute bottom-0.5 end-1 rounded bg-charcoal/55 px-1 text-[9px] font-medium text-white">
              Google
            </span>
          </>
        ) : (
          <ListingPlaceholder name={listing.name} className="absolute inset-0" />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-charcoal">{listing.name}</p>
        <p className="mt-0.5 truncate text-xs text-stone">
          {listing.cuisines.map((c) => t(`cuisines.${c}`)).join(" · ")}
        </p>
        {data?.rating != null && (
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-charcoal">
            <Star className="size-3.5 fill-brass text-brass" aria-hidden />
            <span dir="ltr">{data.rating.toFixed(1)}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
