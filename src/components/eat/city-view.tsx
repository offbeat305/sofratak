"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BadgeCheck, List, MapIcon, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { EAT_CUISINES } from "@/content/eat-metros";
import { CardPhoto } from "./card-photo";
import type { EatListingView } from "./types";

const EatMap = dynamic(() => import("./eat-map"), { ssr: false });

export function CityView({
  city,
  listings,
  center,
  zoom,
}: {
  city: string;
  listings: EatListingView[];
  center: { lat: number; lng: number };
  zoom: number;
}) {
  const t = useTranslations("site.eat");
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [halalOnly, setHalalOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [orderableOnly, setOrderableOnly] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q)) return false;
      if (cuisine && !l.cuisines.includes(cuisine)) return false;
      if (halalOnly && l.halalStatus === "unknown") return false;
      if (openOnly && l.openNow !== true) return false;
      if (orderableOnly && !l.verified) return false;
      return true;
    });
  }, [listings, query, cuisine, halalOnly, openOnly, orderableOnly]);

  // Two-section layout (Zizo): claimed restaurants on top under "Order
  // now", everything else below — filters/search apply to both.
  const claimed = useMemo(
    () => filtered.filter((l) => l.verified).sort((a, b) => a.name.localeCompare(b.name)),
    [filtered],
  );
  const unclaimed = useMemo(
    () => filtered.filter((l) => !l.verified).sort((a, b) => a.name.localeCompare(b.name)),
    [filtered],
  );

  const chipCls = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
      active
        ? "border-olive bg-olive text-ivory"
        : "border-olive/20 bg-white text-charcoal hover:border-olive/50",
    );

  return (
    <div>
      {/* search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 start-3.5 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-12 w-full rounded-full border border-olive/15 bg-white ps-10 pe-4 text-[15px] shadow-[0_2px_10px_rgba(31,31,31,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
          />
        </div>
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            <button type="button" onClick={() => setOrderableOnly(!orderableOnly)} className={chipCls(orderableOnly)}>
              {t("filterOrderable")}
            </button>
            <button type="button" onClick={() => setHalalOnly(!halalOnly)} className={chipCls(halalOnly)}>
              {t("filterHalal")}
            </button>
            <button type="button" onClick={() => setOpenOnly(!openOnly)} className={chipCls(openOnly)}>
              {t("filterOpen")}
            </button>
            <span className="my-1 w-px shrink-0 bg-olive/15" aria-hidden />
            {EAT_CUISINES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCuisine(cuisine === key ? null : key)}
                className={chipCls(cuisine === key)}
              >
                {t(`cuisines.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* mobile list/map toggle */}
      <div className="mt-4 flex justify-center lg:hidden">
        <div className="inline-flex rounded-full border border-olive/15 bg-white p-1">
          {(["list", "map"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setMobileView(view)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-bold",
                mobileView === view ? "bg-olive text-ivory" : "text-charcoal",
              )}
            >
              {view === "list" ? <List className="size-4" aria-hidden /> : <MapIcon className="size-4" aria-hidden />}
              {t(view)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_minmax(320px,45%)]">
        {/* list */}
        <div className={cn("flex flex-col gap-3", mobileView === "map" && "hidden lg:flex")}>
          {claimed.length === 0 && unclaimed.length === 0 && (
            <p className="rounded-card border border-olive/10 bg-white p-6 text-sm text-stone">
              {t("noResults")}
            </p>
          )}

          {claimed.length > 0 && (
            <>
              <h2 className="mt-1 font-display text-xl font-bold text-olive">
                {t("sectionOrderNow")}
              </h2>
              {claimed.map((listing) => (
                <ListingCard key={listing.id} listing={listing} city={city} t={t} onHover={setSelectedId} />
              ))}
            </>
          )}

          {unclaimed.length > 0 && (
            <>
              <div className={cn(claimed.length > 0 && "mt-4")}>
                <h2 className="font-display text-xl font-bold text-olive">
                  {t("sectionMoreTitle")}
                </h2>
                <p className="mt-1 text-sm text-stone">{t("sectionMoreSub")}</p>
              </div>
              {unclaimed.map((listing) => (
                <ListingCard key={listing.id} listing={listing} city={city} t={t} onHover={setSelectedId} />
              ))}
            </>
          )}
        </div>

        {/* map */}
        <div
          className={cn(
            "h-[420px] overflow-hidden rounded-card border border-olive/10 lg:sticky lg:top-20 lg:h-[calc(100dvh-160px)]",
            mobileView === "list" && "hidden lg:block",
          )}
        >
          <EatMap
            listings={listings}
            center={center}
            zoom={zoom}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}

/* Cards carry no halal badge (Zizo: culture-first design — halal lives in
   the filter + a quiet row on the detail page). Claimed vs unclaimed reads
   through Order Now / Verified / section placement, not photo presence. */
function ListingCard({
  listing,
  city,
  t,
  onHover,
}: {
  listing: EatListingView;
  city: string;
  t: ReturnType<typeof useTranslations>;
  onHover: (id: string) => void;
}) {
  return (
    <article
      onMouseEnter={() => onHover(listing.id)}
      className={cn(
        "rounded-card border bg-white transition-colors",
        listing.verified
          ? "border-brass/40 shadow-[0_2px_12px_rgba(169,121,43,0.10)]"
          : "border-olive/10",
      )}
    >
      <Link href={`/eat/${city}/${listing.slug}`} className="flex gap-4 p-4">
        {listing.verified && listing.photoUrl ? (
          <Image
            src={listing.photoUrl}
            alt=""
            width={96}
            height={96}
            unoptimized
            className="size-24 shrink-0 rounded-2xl object-cover"
          />
        ) : listing.hasLivePhotos ? (
          <CardPhoto city={city} slug={listing.slug} />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-bold", listing.verified ? "text-olive" : "text-charcoal/80")}>
              {listing.name}
            </h3>
            {listing.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brass/12 px-2 py-0.5 text-xs font-bold text-brass-deep">
                <BadgeCheck className="size-3.5" aria-hidden />
                {t("verified")}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm text-stone">{listing.address}</p>
          <p className="mt-0.5 text-xs text-stone">
            {listing.cuisines.map((c) => t(`cuisines.${c}`)).join(" · ")}
            {listing.openNow === true && (
              <span className="ms-2 font-bold text-positive">{t("openNow")}</span>
            )}
            {listing.openNow === false && (
              <span className="ms-2 font-semibold text-error">{t("closedNow")}</span>
            )}
          </p>
          <div className="mt-2.5">
            {listing.verified && listing.orderPath ? (
              <span className="inline-flex h-9 items-center rounded-btn bg-brass px-4 text-sm font-bold text-ivory">
                {t("orderNow")}
              </span>
            ) : (
              <span className="text-sm font-semibold text-stone underline-offset-4 hover:underline">
                {t("claimCta")} →
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
