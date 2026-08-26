import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMetro } from "@/content/eat-metros";
import { getStore } from "@/lib/db/store";
import { composeListingView, composeMetroListings } from "@/lib/eat/compose";
import { ClaimForm } from "@/components/eat/claim-form";
import { ListingProfile } from "@/components/eat/listing-profile";
import { NearbyRail } from "@/components/eat/nearby-rail";
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
    description: `${listing.name}, ${listing.address}`,
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
    ...(view.verified &&
      view.orderPath && {
        acceptsReservations: false,
        potentialAction: {
          "@type": "OrderAction",
          target: `${SITE_URL}/en${view.orderPath}`,
        },
      }),
  };
}

function breadcrumbJsonLd(rootLabel: string, metroLabel: string, view: EatListingView, city: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: rootLabel, item: `${SITE_URL}/en/eat` },
      { "@type": "ListItem", position: 2, name: metroLabel, item: `${SITE_URL}/en/eat/${city}` },
      { "@type": "ListItem", position: 3, name: view.name },
    ],
  };
}

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

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
  const blurb =
    loc === "ar" ? listing.customBlurbAr || listing.customBlurb : listing.customBlurb;
  const hours = view.verified
    ? ((await store.getRestaurantById(listing.claimedRestaurantId!))?.hours ?? null)
    : listing.hours;

  // 6 closest same-metro listings for the nearby rail (haversine when
  // both sides have pins, alphabetical tail otherwise).
  const all = (await composeMetroListings(metro)).filter((l) => l.id !== view.id);
  const nearby = (
    view.lat !== null && view.lng !== null
      ? all
          .map((l) => ({
            l,
            d:
              l.lat !== null && l.lng !== null
                ? haversineMi({ lat: view.lat!, lng: view.lng! }, { lat: l.lat, lng: l.lng })
                : Infinity,
          }))
          .sort((a, b) => a.d - b.d)
          .map((x) => x.l)
      : all
  ).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 pt-24 pb-14 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd(view, city)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(t("breadcrumbRoot"), metro.name[loc], view, city)),
        }}
      />

      {/* breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-stone" aria-label="Breadcrumb">
        <Link href="/eat" className="font-semibold hover:text-olive">
          {t("breadcrumbRoot")}
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/eat/${city}`} className="font-semibold hover:text-olive">
          {metro.name[loc]}
        </Link>
        <span aria-hidden>›</span>
        <span className="text-charcoal">{view.name}</span>
      </nav>

      <ListingProfile
        city={city}
        view={view}
        hours={hours}
        blurb={blurb ?? null}
        days={days}
        showLiveAddress={view.address.split(",").length < 3}
      />

      {/* claim funnel (unclaimed only) — the sidebar card anchors here */}
      {!view.verified && (
        <section id="claim" className="card-crisp mt-10 scroll-mt-24 rounded-card bg-white p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-olive">{t("claimTitle")}</h2>
          <p className="mt-1 text-sm text-stone">{t("claimSub")}</p>
          <div className="mt-4">
            <ClaimForm listingId={view.id} listingName={view.name} city={city} />
          </div>
        </section>
      )}

      <NearbyRail city={city} listings={nearby} />

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
