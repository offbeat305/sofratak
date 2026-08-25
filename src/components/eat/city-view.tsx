"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { BadgeCheck, ChevronDown, MapIcon, Search, Star, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { EAT_CUISINES } from "@/content/eat-metros";
import { ListingPlaceholder } from "./listing-placeholder";
import { useListingEnrichment } from "./use-listing-enrichment";
import type { EatListingView } from "./types";

const EatMap = dynamic(() => import("./eat-map"), { ssr: false });

type SortKey = "recommended" | "rating" | "distance" | "az";

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** "21:30" → localized "9:30 PM" */
function formatClose(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    hour: "numeric",
    minute: m ? "2-digit" : undefined,
  }).format(new Date(2000, 0, 1, h, m));
}

/**
 * Yelp-grade metro page (design-pass-2 A1): desktop = scrollable result
 * list (60%) + sticky map (40%) with two-way hover linking; dense
 * numbered rows; mobile = list-first with a floating Map pill opening a
 * full-screen map + card carousel.
 */
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
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [halalOnly, setHalalOnly] = useState(false);
  const [openOnly, setOpenOnly] = useState(false);
  const [orderableOnly, setOrderableOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [flyToId, setFlyToId] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  // live ratings reported up by rows as their enrichment loads — feeds
  // the Rating / Recommended sorts without any eager fetching
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const rowEls = useRef(new Map<string, HTMLElement>());
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const reportRating = useCallback((id: string, rating: number) => {
    setRatings((prev) => (prev[id] === rating ? prev : { ...prev, [id]: rating }));
  }, []);

  const registerRow = useCallback((id: string, el: HTMLElement | null) => {
    if (el) rowEls.current.set(id, el);
    else rowEls.current.delete(id);
  }, []);

  const pickSort = (key: SortKey) => {
    setSort(key);
    if (key === "distance" && !userLoc && typeof navigator !== "undefined") {
      navigator.geolocation?.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setSort("recommended"),
        { maximumAge: 300_000 },
      );
    }
  };

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

  // Claimed always ranks first (product decision); sort applies within
  // each group. Numbering is continuous across both sections so rows
  // match the numbered map pins.
  const ordered = useMemo(() => {
    const cmp = (a: EatListingView, b: EatListingView): number => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "distance" && userLoc) {
        const da = a.lat !== null && a.lng !== null ? haversineMi(userLoc, { lat: a.lat, lng: a.lng }) : Infinity;
        const db = b.lat !== null && b.lng !== null ? haversineMi(userLoc, { lat: b.lat, lng: b.lng }) : Infinity;
        return da - db || a.name.localeCompare(b.name);
      }
      if (sort === "rating") {
        // live rating desc, unknown last — reordering while data streams
        // in is expected under an explicit Rating sort
        const ra = ratings[a.id] ?? -1;
        const rb = ratings[b.id] ?? -1;
        return rb - ra || a.name.localeCompare(b.name);
      }
      // recommended: stable order (claimed-first via the grouping below,
      // alphabetical within) — sorting by lazily-loaded ratings here
      // would reshuffle rows under the reader
      return a.name.localeCompare(b.name);
    };
    const claimed = filtered.filter((l) => l.verified).sort(cmp);
    const rest = filtered.filter((l) => !l.verified).sort(cmp);
    return { claimed, rest, all: [...claimed, ...rest] };
  }, [filtered, sort, ratings, userLoc]);

  const onPinClick = useCallback(
    (id: string) => {
      if (mapOpen) {
        // mobile overlay: snap the carousel to the card
        const card = carouselRef.current?.querySelector<HTMLElement>(`[data-card="${id}"]`);
        card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        setHoveredId(id);
        return;
      }
      const el = rowEls.current.get(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      // some engines silently drop smooth scrolling — jump if nothing moved
      const y0 = window.scrollY;
      window.setTimeout(() => {
        if (el && Math.abs(window.scrollY - y0) < 4) el.scrollIntoView({ block: "center" });
      }, 220);
      setFlashId(id);
      window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 950);
    },
    [mapOpen],
  );

  // Carousel scroll → highlight + pan to the centered card's pin.
  const onCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best: { id: string; d: number } | null = null;
    for (const card of el.querySelectorAll<HTMLElement>("[data-card]")) {
      const c = card.offsetLeft + card.offsetWidth / 2;
      const d = Math.abs(c - mid);
      if (!best || d < best.d) best = { id: card.dataset.card!, d };
    }
    if (best) {
      setHoveredId(best.id);
      setFlyToId(best.id);
    }
  }, []);

  const chipCls = (active: boolean) =>
    cn(
      "press shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
      active
        ? "chip-pop border-olive bg-olive text-ivory"
        : "border-olive/20 bg-white text-charcoal hover:border-olive/50",
    );

  const distanceOf = (l: EatListingView) =>
    userLoc && l.lat !== null && l.lng !== null
      ? haversineMi(userLoc, { lat: l.lat, lng: l.lng })
      : null;

  const sectionsEmpty = ordered.all.length === 0;

  return (
    <div>
      {/* sticky filter bar */}
      <div className="sticky top-14 z-30 -mx-4 border-b border-olive/10 bg-ivory/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-stone" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 w-full rounded-full border border-olive/15 bg-white ps-9 pe-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
            />
          </div>
          <label className="relative shrink-0">
            <span className="sr-only">{t("sortLabel")}</span>
            <select
              value={sort}
              onChange={(e) => pickSort(e.target.value as SortKey)}
              className="press h-10 appearance-none rounded-full border border-olive/20 bg-white pe-8 ps-4 text-sm font-semibold text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/25"
            >
              <option value="recommended">{t("sortRecommended")}</option>
              <option value="rating">{t("sortRating")}</option>
              <option value="distance">{t("sortDistance")}</option>
              <option value="az">{t("sortAz")}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-stone" aria-hidden />
          </label>
        </div>
        <div className="-mx-4 mt-2.5 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
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

      <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-5">
        {/* result list */}
        <div className="flex flex-col">
          {sectionsEmpty && (
            <p className="card-crisp rounded-card bg-white p-6 text-sm text-stone">{t("noResults")}</p>
          )}

          {ordered.claimed.length > 0 && (
            <>
              <h2 className="mb-2 font-display text-lg font-bold text-olive">{t("sectionOrderNow")}</h2>
              {ordered.claimed.map((l, i) => (
                <ResultRow
                  key={l.id}
                  listing={l}
                  index={i + 1}
                  city={city}
                  locale={locale}
                  flash={flashId === l.id}
                  distanceMi={distanceOf(l)}
                  onHover={setHoveredId}
                  register={registerRow}
                  reportRating={reportRating}
                  t={t}
                />
              ))}
            </>
          )}

          {ordered.rest.length > 0 && (
            <>
              <div className={cn("mb-2", ordered.claimed.length > 0 && "mt-6")}>
                <h2 className="font-display text-lg font-bold text-olive">{t("sectionMoreTitle")}</h2>
                <p className="mt-0.5 text-sm text-stone">{t("sectionMoreSub")}</p>
              </div>
              {ordered.rest.map((l, i) => (
                <ResultRow
                  key={l.id}
                  listing={l}
                  index={ordered.claimed.length + i + 1}
                  city={city}
                  locale={locale}
                  flash={flashId === l.id}
                  distanceMi={distanceOf(l)}
                  onHover={setHoveredId}
                  register={registerRow}
                  reportRating={reportRating}
                  t={t}
                />
              ))}
            </>
          )}
        </div>

        {/* sticky desktop map */}
        <div className="hidden lg:block">
          <div className="card-crisp sticky top-[7.5rem] h-[calc(100dvh-9rem)] overflow-hidden rounded-card">
            <EatMap
              listings={ordered.all}
              center={center}
              zoom={zoom}
              hoveredId={hoveredId}
              flyToId={null}
              onPinClick={onPinClick}
            />
          </div>
        </div>
      </div>

      {/* mobile: floating map pill */}
      <button
        type="button"
        onClick={() => setMapOpen(true)}
        className="press fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit items-center gap-2 rounded-full bg-olive px-5 py-3 text-sm font-bold text-ivory shadow-[0_6px_20px_rgba(37,59,48,0.35)] lg:hidden"
      >
        <MapIcon className="size-4" aria-hidden />
        {t("map")}
      </button>

      {/* mobile: full-screen map + card carousel */}
      {mapOpen && (
        <div className="fixed inset-0 z-[70] bg-ivory lg:hidden">
          <EatMap
            listings={ordered.all}
            center={center}
            zoom={zoom}
            hoveredId={hoveredId}
            flyToId={flyToId}
            onPinClick={onPinClick}
          />
          <button
            type="button"
            onClick={() => {
              setMapOpen(false);
              setFlyToId(null);
            }}
            className="press absolute top-4 end-4 z-[1000] flex size-10 items-center justify-center rounded-full bg-olive text-ivory shadow-lg"
            aria-label={t("list")}
          >
            <X className="size-5" aria-hidden />
          </button>
          <div
            ref={carouselRef}
            onScroll={onCarouselScroll}
            className="absolute inset-x-0 bottom-0 z-[1000] flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-2 pb-5"
          >
            {ordered.all.map((l, i) => (
              <Link
                key={l.id}
                data-card={l.id}
                href={`/eat/${city}/${l.slug}`}
                className="card-crisp flex w-[80vw] max-w-xs shrink-0 snap-center items-center gap-3 rounded-card bg-white p-3"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-ivory",
                    l.verified ? "bg-brass" : "bg-olive",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-charcoal">{l.name}</p>
                  <p className="truncate text-xs text-stone">{l.address || t(`cuisines.${l.cuisines[0] ?? "mediterranean"}`)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Dense Yelp-style result row: number · photo 120×120 · content · CTA.
   Hover deepens the background and draws a 2px brass start edge; live
   rating/summary skeleton-shimmer in and never pop. */
function ResultRow({
  listing,
  index,
  city,
  locale,
  flash,
  distanceMi,
  onHover,
  register,
  reportRating,
  t,
}: {
  listing: EatListingView;
  index: number;
  city: string;
  locale: string;
  flash: boolean;
  distanceMi: number | null;
  onHover: (id: string | null) => void;
  register: (id: string, el: HTMLElement | null) => void;
  reportRating: (id: string, rating: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const { ref, data, status } = useListingEnrichment(city, listing.slug, listing.hasLivePhotos);

  useEffect(() => {
    if (data?.rating != null) reportRating(listing.id, data.rating);
  }, [data, listing.id, reportRating]);

  const photoName = data?.photoNames?.[0] ?? null;
  const rating = data?.rating ?? null;

  const meta: string[] = [];
  if (listing.openUntil) meta.push(t("openUntil", { time: formatClose(listing.openUntil, locale) }));
  else if (listing.openNow === false) meta.push(t("closedNow"));
  if (distanceMi !== null) meta.push(t("distanceMi", { mi: distanceMi.toFixed(1) }));

  return (
    <article
      ref={(el) => {
        ref.current = el;
        register(listing.id, el);
      }}
      onMouseEnter={() => onHover(listing.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group border-b border-olive/10 border-s-2 border-s-transparent transition-colors hover:border-s-brass hover:bg-olive/[0.04]",
        flash && "row-flash",
      )}
    >
      <Link href={`/eat/${city}/${listing.slug}`} className="flex gap-3.5 px-2 py-4 sm:gap-4 sm:px-3">
        <span
          className={cn(
            "mt-1 hidden size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-ivory sm:flex",
            listing.verified ? "bg-brass" : "bg-olive",
          )}
        >
          {index}
        </span>

        {/* photo: storefront banner (claimed) → live Google photo →
            designed arch placeholder. 120×120, radius 12px. */}
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl sm:size-30">
          {listing.verified && listing.photoUrl ? (
            <Image src={listing.photoUrl} alt="" fill unoptimized className="object-cover" />
          ) : status === "loading" ? (
            <div className="skeleton absolute inset-0" />
          ) : photoName ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- live Places photo, must never touch next/image's cache */}
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

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="sm:hidden">
              <span
                className={cn(
                  "me-0.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold text-ivory",
                  listing.verified ? "bg-brass" : "bg-olive",
                )}
              >
                {index}
              </span>
            </span>
            <h3 className="truncate font-semibold text-charcoal group-hover:text-olive">
              {listing.name}
            </h3>
            {listing.verified && (
              <BadgeCheck className="size-4.5 shrink-0 fill-brass/15 text-brass" aria-hidden />
            )}
          </div>

          {/* live rating row */}
          {status === "loading" ? (
            <div className="skeleton mt-1.5 h-3.5 w-32 rounded" />
          ) : rating !== null ? (
            <p className="mt-1 flex items-center gap-1 text-sm">
              <span className="flex" aria-hidden>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "size-3.5",
                      s <= Math.round(rating) ? "fill-brass text-brass" : "fill-olive/10 text-olive/20",
                    )}
                  />
                ))}
              </span>
              <span className="font-bold text-charcoal" dir="ltr">
                {rating.toFixed(1)}
              </span>
              {data?.userRatingCount != null && (
                <span className="text-stone" dir="ltr">
                  ({Intl.NumberFormat().format(data.userRatingCount)})
                </span>
              )}
            </p>
          ) : null}

          <p className="mt-1 truncate text-xs text-stone">
            {listing.cuisines.map((c) => t(`cuisines.${c}`)).join(" · ")}
            {meta.length > 0 && (
              <>
                {listing.cuisines.length > 0 && " · "}
                {listing.openUntil ? (
                  <span className="font-semibold text-positive">{meta[0]}</span>
                ) : (
                  meta[0] && <span className="font-semibold text-error">{meta[0]}</span>
                )}
                {meta[1] && ` · ${meta[1]}`}
              </>
            )}
          </p>

          {data?.editorialSummary && (
            <p className="mt-1 line-clamp-1 text-sm text-stone">{data.editorialSummary}</p>
          )}

          <div className="mt-2 sm:hidden">
            {listing.verified && listing.orderPath ? (
              <span className="press inline-flex h-8 items-center rounded-btn bg-brass px-3.5 text-xs font-bold text-ivory">
                {t("orderNow")}
              </span>
            ) : (
              <span className="text-xs font-semibold text-stone underline-offset-4 group-hover:underline">
                {t("claimCta")} →
              </span>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center sm:flex">
          {listing.verified && listing.orderPath ? (
            <span className="press btn-shine inline-flex h-9 items-center rounded-btn bg-brass px-4 text-sm font-bold text-ivory">
              {t("orderNow")}
            </span>
          ) : (
            <span className="text-sm font-semibold text-stone underline-offset-4 group-hover:underline">
              {t("claimCta")}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
