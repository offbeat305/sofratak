"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import {
  getListingEnrichmentAction,
} from "@/app/[locale]/(marketing)/eat/actions";
import type { LiveEnrichment } from "@/lib/eat/places-live";

/**
 * Live Google data on unclaimed listing pages — fetched at view time,
 * displayed with the required Google attribution, never stored. Plain
 * <img> on purpose: next/image's optimizer would cache a copy of the
 * photos on our server, which Places ToS prohibits.
 */
export function PlacesEnrichment({
  city,
  slug,
  showHours,
}: {
  city: string;
  slug: string;
  /** only render Google's hours when the listing itself has none */
  showHours: boolean;
}) {
  const t = useTranslations("site.eat");
  const [data, setData] = useState<LiveEnrichment | null>(null);

  useEffect(() => {
    let cancelled = false;
    getListingEnrichmentAction(city, slug).then((result) => {
      if (!cancelled) setData(result);
    });
    return () => {
      cancelled = true;
    };
  }, [city, slug]);

  if (!data) return null;

  return (
    <section className="mt-6">
      {data.photoNames.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-3">
            {data.photoNames.map((name) => (
              // Live Places display: next/image would cache Google's photo
              // on our server, which their ToS prohibits — plain img only.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={name}
                src={`/api/eat/photo?name=${encodeURIComponent(name)}`}
                alt=""
                loading="lazy"
                className="h-44 w-64 shrink-0 rounded-card object-cover sm:h-52"
              />
            ))}
          </div>
        </div>
      )}

      {data.rating !== null && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal">
          <Star className="size-4 fill-brass text-brass" aria-hidden />
          <span dir="ltr">{data.rating.toFixed(1)}</span>
          {data.userRatingCount !== null && (
            <span className="font-normal text-stone">
              {t("enrichReviews", { count: data.userRatingCount })}
            </span>
          )}
        </p>
      )}

      {showHours && data.weekdayText && data.weekdayText.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-bold tracking-wide text-stone uppercase">{t("hoursTitle")}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-charcoal">
            {data.weekdayText.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-xs text-stone">
        {/* Google attribution requirement — literal, untranslated */}
        Powered by Google
        {data.photoAttributions.length > 0 && (
          <> · {t("photoBy")} {data.photoAttributions.join(", ")}</>
        )}
      </p>
    </section>
  );
}
