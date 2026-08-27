"use client";

import { Button } from "@/components/marketing/button";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Images,
  Navigation,
  Phone,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ListingPlaceholder } from "./listing-placeholder";
import { useListingEnrichment } from "./use-listing-enrichment";
import type { DayHours } from "@/lib/db/types";
import type { EatListingView } from "./types";

const EatMap = dynamic(() => import("./eat-map"), { ssr: false });

const DAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** "21:30" → localized "9:30 PM" */
function formatClose(hhmm: string, locale: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    hour: "numeric",
    minute: m ? "2-digit" : undefined,
  }).format(new Date(2000, 0, 1, h, m));
}

/**
 * Yelp-grade business profile (design-pass-2 A2): photo-collage hero
 * with scrim + lightbox, two-column body with amenities / hours
 * accordion / map thumbnail, and a sticky action card that turns every
 * unclaimed page into a mini landing page for the claim funnel. One
 * live-enrichment fetch feeds hero, rating, summary, and hours.
 */
export function ListingProfile({
  city,
  view,
  hours,
  blurb,
  days,
  showLiveAddress,
}: {
  city: string;
  view: EatListingView;
  hours: DayHours[] | null;
  /** custom_blurb resolved per locale — overrides Google's summary */
  blurb: string | null;
  /** localized weekday names (index 0 = Sunday) */
  days: string[];
  showLiveAddress: boolean;
}) {
  const t = useTranslations("site.eat");
  const locale = useLocale();
  const { ref, data, status } = useListingEnrichment(city, view.slug, view.hasLivePhotos);
  const [lightbox, setLightbox] = useState<number | null>(null);
  // photos that failed to stream (proxy rate-limit etc.) fall back to the
  // designed placeholder instead of a blank cell (design-pass-2 A3)
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const photos = (data?.photoNames ?? [])
    .map((n) => `/api/eat/photo?name=${encodeURIComponent(n)}`)
    .filter((src) => !failed.has(src));
  const markFailed = (src: string) =>
    setFailed((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  const address = showLiveAddress && data?.formattedAddress ? data.formattedAddress : view.address;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${view.name} ${address}`,
  )}`;
  const todayIdx = new Date().getDay();

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setLightbox((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  const heroScrim = (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-olive-deep/90 via-olive-deep/45 to-transparent px-4 pt-16 pb-4 sm:px-6">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-bold text-ivory sm:text-3xl">{view.name}</h1>
        {view.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brass px-2.5 py-1 text-xs font-bold text-ivory">
            <BadgeCheck className="size-4" aria-hidden />
            {t("verified")}
          </span>
        )}
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ivory/85">
        {view.cuisines.length > 0 && <span>{view.cuisines.map((c) => t(`cuisines.${c}`)).join(" · ")}</span>}
        {data?.rating != null && (
          <span className="inline-flex items-center gap-1 font-semibold">
            <Star className="size-4 fill-brass text-brass" aria-hidden />
            <span dir="ltr">{data.rating.toFixed(1)}</span>
            {data.userRatingCount != null && (
              <span className="font-normal text-ivory/70" dir="ltr">
                ({Intl.NumberFormat().format(data.userRatingCount)})
              </span>
            )}
          </span>
        )}
      </p>
    </div>
  );

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {/* ── hero: photo collage (big left + 2×2 right) ─────────────── */}
      <div className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-card">
        {view.verified && view.photoUrl ? (
          <div className="relative h-64 sm:h-80">
            <Image src={view.photoUrl} alt="" fill unoptimized className="object-cover" />
            {heroScrim}
          </div>
        ) : status === "loading" ? (
          <div className="skeleton h-64 sm:h-80" />
        ) : photos.length > 0 ? (
          <div className="relative">
            <div className="grid h-64 grid-cols-2 gap-1 sm:h-80 sm:grid-cols-[2fr_1fr_1fr]">
              <button
                type="button"
                onClick={() => setLightbox(0)}
                className="relative col-span-2 overflow-hidden sm:col-span-1 sm:row-span-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- live Places photos, never next/image */}
                <img src={photos[0]} alt="" onError={() => markFailed(photos[0])} className="size-full object-cover" />
              </button>
              {[1, 2, 3, 4].map((i) =>
                photos[i] ? (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="relative hidden overflow-hidden sm:block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- live Places photos, never next/image */}
                    <img src={photos[i]} alt="" loading="lazy" onError={() => markFailed(photos[i])} className="size-full object-cover" />
                  </button>
                ) : (
                  <ListingPlaceholder key={i} name={view.name} className="hidden sm:block" />
                ),
              )}
            </div>
            {heroScrim}
            <button
              type="button"
              onClick={() => setLightbox(0)}
              className="press absolute top-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-ivory/95 px-3.5 py-2 text-xs font-bold text-olive shadow"
            >
              <Images className="size-4" aria-hidden />
              {t("seeAllPhotos")}
            </button>
          </div>
        ) : (
          <div className="relative h-56 sm:h-64">
            <ListingPlaceholder name={view.name} className="absolute inset-0" />
            {heroScrim}
          </div>
        )}
      </div>

      {/* ── body: main column + sticky action card ─────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {/* about */}
          {status === "loading" ? (
            <div className="flex flex-col gap-2">
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-2/3 rounded" />
            </div>
          ) : (
            (blurb || data?.editorialSummary) && (
              <p className="text-[15px] leading-relaxed text-charcoal">
                {blurb || data?.editorialSummary}
              </p>
            )
          )}

          {/* amenities row */}
          <div className="mt-4 flex flex-wrap gap-2">
            {view.openUntil ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1.5 text-sm font-semibold text-positive">
                <Clock className="size-4" aria-hidden />
                {t("openUntil", { time: formatClose(view.openUntil, locale) })}
              </span>
            ) : view.openNow === false ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1.5 text-sm font-semibold text-error">
                <Clock className="size-4" aria-hidden />
                {t("closedNow")}
              </span>
            ) : null}
            {view.phone && (
              <a
                href={`tel:${view.phone}`}
                className="press inline-flex items-center gap-1.5 rounded-full border border-olive/20 bg-white px-3 py-1.5 text-sm font-semibold text-charcoal hover:border-olive/50"
              >
                <Phone className="size-4 text-olive" aria-hidden />
                {t("call")}
              </a>
            )}
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer"
              className="press inline-flex items-center gap-1.5 rounded-full border border-olive/20 bg-white px-3 py-1.5 text-sm font-semibold text-charcoal hover:border-olive/50"
            >
              <Navigation className="size-4 text-olive" aria-hidden />
              {t("directions")}
            </a>
          </div>

          {/* quiet halal row */}
          {view.halalStatus !== "unknown" && (
            <p className="mt-3 text-sm text-stone">
              {view.halalStatus === "verified" ? t("halalRowOwner") : t("halalRowReported")}
            </p>
          )}

          {address && <p className="mt-3 text-sm text-charcoal">{address}</p>}

          {/* hours accordion — today bolded; falls back to live Google hours */}
          {hours && hours.length > 0 ? (
            <details className="card-crisp group mt-5 rounded-card bg-white" open>
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold tracking-wide text-stone uppercase">
                {t("hoursTitle")}
              </summary>
              <ul className="flex flex-col gap-1 px-4 pb-4 text-sm text-charcoal">
                {DAY_KEYS.map((day) => {
                  const h = hours.find((x) => x.day === day);
                  const today = day === todayIdx;
                  return (
                    <li key={day} className={cn("flex justify-between gap-4", today && "font-bold text-olive")}>
                      <span>{days[day]}</span>
                      <span dir="ltr" className="tabular-nums">
                        {h ? `${h.open}–${h.close}` : t("closedDay")}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </details>
          ) : data?.weekdayText && data.weekdayText.length > 0 ? (
            <details className="card-crisp group mt-5 rounded-card bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold tracking-wide text-stone uppercase">
                {t("hoursTitle")}
              </summary>
              <ul className="flex flex-col gap-1 px-4 pb-4 text-sm text-charcoal">
                {data.weekdayText.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {/* map thumbnail → directions */}
          {view.lat !== null && view.lng !== null && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noreferrer"
              className="card-crisp relative mt-5 block h-44 overflow-hidden rounded-card"
              aria-label={t("directions")}
            >
              <div className="pointer-events-none h-full w-full">
                <EatMap
                  listings={[view]}
                  center={{ lat: view.lat, lng: view.lng }}
                  zoom={15}
                  hoveredId={null}
                  flyToId={null}
                  onPinClick={() => {}}
                />
              </div>
              <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-olive px-3.5 py-2 text-xs font-bold text-ivory shadow">
                <Navigation className="size-4" aria-hidden />
                {t("directions")}
              </span>
            </a>
          )}

          {/* Google attribution — required for live content */}
          {(photos.length > 0 || data?.rating != null) && (
            <p className="mt-4 text-xs text-stone">
              Powered by Google
              {data && data.photoAttributions.length > 0 && (
                <>
                  {" "}
                  · {t("photoBy")} {data.photoAttributions.join(", ")}
                </>
              )}
            </p>
          )}
        </div>

        {/* sticky action card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-crisp rounded-card bg-white p-5">
            {view.verified && view.orderPath ? (
              <>
                <Button href={view.orderPath} size="lg" className="w-full">
                  {t("orderNow")}
                </Button>
                <div className="mt-3 flex flex-col gap-2 text-sm">
                  {view.phone && (
                    <a href={`tel:${view.phone}`} dir="ltr" className="inline-flex items-center gap-2 font-semibold text-charcoal hover:text-olive">
                      <Phone className="size-4 text-olive" aria-hidden />
                      {view.phone}
                    </a>
                  )}
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-charcoal hover:text-olive"
                  >
                    <Navigation className="size-4 text-olive" aria-hidden />
                    {t("directions")}
                  </a>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-lg font-bold text-olive">{t("ownThis")}</h2>
                <p className="mt-1 text-sm text-stone">{t("claimPitch")}</p>
                <Button href="#claim" size="sm" className="mt-4 w-full">
                  {t("claimCta")}
                </Button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* ── lightbox ───────────────────────────────────────────────── */}
      {lightbox !== null && photos.length > 0 && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-charcoal/95" role="dialog" aria-modal>
          <div className="flex items-center justify-between p-4">
            <span className="text-sm font-semibold text-ivory/80" dir="ltr">
              {lightbox + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="press flex size-10 items-center justify-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-14 pb-8">
            {/* eslint-disable-next-line @next/next/no-img-element -- live Places photo, never next/image */}
            <img src={photos[lightbox]} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox - 1 + photos.length) % photos.length)}
                  className="press absolute start-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-6 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox + 1) % photos.length)}
                  className="press absolute end-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/10 text-ivory hover:bg-ivory/20"
                  aria-label="Next"
                >
                  <ChevronRight className="size-6 rtl:rotate-180" aria-hidden />
                </button>
              </>
            )}
          </div>
          <p className="pb-4 text-center text-xs text-ivory/60">
            Powered by Google
            {data && data.photoAttributions.length > 0 && <> · {t("photoBy")} {data.photoAttributions.join(", ")}</>}
          </p>
        </div>
      )}
    </div>
  );
}
