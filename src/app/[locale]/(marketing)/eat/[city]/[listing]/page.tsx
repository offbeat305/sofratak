import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getMetro } from "@/content/eat-metros";
import { getStore } from "@/lib/db/store";
import { composeListingView } from "@/lib/eat/compose";
import { ClaimForm } from "@/components/eat/claim-form";
import { PlacesEnrichment } from "@/components/eat/places-enrichment";
import { localeAlternates, SITE_URL } from "@/lib/seo";
import type { EatListingView } from "@/components/eat/types";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; city: string; listing: string }>;
}): Promise<Metadata> {
  const { locale, city, listing: listingSlug } = await params;
  const metro = getMetro(city);
  if (!metro) return {};
  const listing = await getStore().getDirectoryListing(city, listingSlug);
  if (!listing) return {};
  const t = await getTranslations("site.eat");
  const loc = locale as "en" | "ar";
  return {
    title: t("listingTitle", { name: listing.name, city: metro.name[loc] }),
    description: `${listing.name} — ${listing.address}`,
    alternates: localeAlternates(locale, `/eat/${city}/${listingSlug}`),
  };
}

function listingJsonLd(view: EatListingView, city: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: view.name,
    address: { "@type": "PostalAddress", streetAddress: view.address },
    ...(view.lat !== null &&
      view.lng !== null && {
        geo: { "@type": "GeoCoordinates", latitude: view.lat, longitude: view.lng },
      }),
    ...(view.phone && { telephone: view.phone }),
    ...(view.cuisines.length > 0 && { servesCuisine: view.cuisines }),
    url: `${SITE_URL}/en/eat/${city}/${view.slug}`,
    ...(view.verified && view.orderPath && {
      acceptsReservations: false,
      potentialAction: {
        "@type": "OrderAction",
        target: `${SITE_URL}/en${view.orderPath}`,
      },
    }),
  };
}

const DAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const;

export default async function EatListingPage({
  params,
}: {
  params: Promise<{ locale: string; city: string; listing: string }>;
}) {
  const { locale, city, listing: listingSlug } = await params;
  const metro = getMetro(city);
  if (!metro) notFound();
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("site.eat");
  const tSf = await getTranslations("storefront");
  const days = tSf.raw("days") as string[];

  const store = getStore();
  const listing = await store.getDirectoryListing(city, listingSlug);
  if (!listing || !listing.published) notFound();
  const view = await composeListingView(listing, metro);
  const hours = view.verified
    ? (await store.getRestaurantById(listing.claimedRestaurantId!))?.hours ?? null
    : listing.hours;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-24 pb-14 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(view, city)) }}
      />

      <Link href={`/eat/${city}`} className="text-sm font-semibold text-stone hover:text-olive">
        ← {t("backToCity", { city: metro.name[loc] })}
      </Link>

      {view.verified && view.photoUrl && (
        <div className="relative mt-4 h-44 overflow-hidden rounded-card sm:h-56">
          <Image src={view.photoUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-bold text-olive">{view.name}</h1>
        {view.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brass/12 px-2.5 py-1 text-xs font-bold text-brass-deep">
            <BadgeCheck className="size-4" aria-hidden />
            {t("verified")}
          </span>
        )}
        {view.halalStatus === "verified" && (
          <span className="rounded-full bg-positive/10 px-2.5 py-1 text-xs font-bold text-positive">
            {t("halalVerified")}
          </span>
        )}
        {view.halalStatus === "reported" && (
          <span className="rounded-full bg-olive/8 px-2.5 py-1 text-xs font-semibold text-stone">
            {t("halalReported")}
          </span>
        )}
      </div>

      {view.cuisines.length > 0 && (
        <p className="mt-1 text-stone">{view.cuisines.map((c) => t(`cuisines.${c}`)).join(" · ")}</p>
      )}

      <div className="mt-4 flex flex-col gap-2 text-[15px] text-charcoal">
        {view.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(`${view.name} ${view.address}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-olive"
          >
            <MapPin className="size-4 shrink-0 text-stone" aria-hidden />
            {view.address}
          </a>
        )}
        {view.phone && (
          <a href={`tel:${view.phone}`} dir="ltr" className="inline-flex items-center gap-2 hover:text-olive">
            <Phone className="size-4 shrink-0 text-stone" aria-hidden />
            {view.phone}
          </a>
        )}
      </div>

      {!view.verified && (
        <PlacesEnrichment
          city={city}
          slug={listingSlug}
          name={view.name}
          showHours={!hours || hours.length === 0}
          // area-level stored address (same heuristic as the seed script's
          // no-pin rule) → let Google's live formattedAddress fill in
          showAddress={view.address.split(",").length < 3}
        />
      )}

      {view.verified && view.orderPath ? (
        <Link
          href={view.orderPath}
          className="btn-shine mt-6 inline-flex h-13 items-center rounded-btn bg-brass px-8 text-lg font-bold text-ivory transition-transform duration-150 hover:scale-[1.02] motion-reduce:hover:scale-100"
        >
          {t("orderNow")}
        </Link>
      ) : (
        <section className="mt-8 rounded-card border border-olive/10 bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-olive">{t("claimTitle")}</h2>
          <p className="mt-1 text-sm text-stone">{t("claimSub")}</p>
          <div className="mt-4">
            <ClaimForm listingId={view.id} listingName={view.name} city={city} />
          </div>
        </section>
      )}

      {hours && hours.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold tracking-wide text-stone uppercase">{t("hoursTitle")}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-charcoal">
            {DAY_KEYS.map((day) => {
              const h = hours.find((x) => x.day === day);
              return (
                <li key={day} className="flex justify-between gap-4">
                  <span>{days[day]}</span>
                  <span dir="ltr" className="tabular-nums">
                    {h ? `${h.open}–${h.close}` : t("closedDay")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {!view.verified && (
        <footer className="mt-10 border-t border-olive/10 pt-4 text-xs text-stone">
          <p>{t("unclaimedDisclaimer")}</p>
          {listing.source === "osm" && (
            <p className="mt-2">
              {t("osmAttribution")}{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-olive"
              >
                © OpenStreetMap contributors
              </a>
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold hover:text-olive">
              {t("takedownLink")}
            </summary>
            <div className="mt-3">
              <ClaimForm listingId={view.id} listingName={view.name} city={city} takedown />
            </div>
          </details>
        </footer>
      )}
    </div>
  );
}
