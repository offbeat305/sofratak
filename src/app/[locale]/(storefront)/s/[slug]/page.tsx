import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { getStore } from "@/lib/db/store";
import type { Menu, Restaurant } from "@/lib/db/types";
import { MenuBrowser } from "@/components/storefront/menu-browser";
import { FunnelBeacon } from "@/components/storefront/funnel-beacon";

type Params = Promise<{ locale: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) return {};
  const loc = locale as "en" | "ar";
  return {
    title: restaurant.name[loc],
    description: restaurant.tagline[loc],
    openGraph: {
      title: restaurant.name[loc],
      description: restaurant.tagline[loc],
      type: "website",
    },
  };
}

function restaurantJsonLd(restaurant: Restaurant, menu: Menu) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name.en,
    servesCuisine: ["Middle Eastern", "Mediterranean"],
    telephone: restaurant.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address.line1,
      addressLocality: restaurant.address.city,
      addressRegion: restaurant.address.state,
      postalCode: restaurant.address.zip,
      addressCountry: "US",
    },
    openingHoursSpecification: restaurant.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
      ][h.day],
      opens: h.open,
      closes: h.close,
    })),
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: menu.categories.map((cat) => ({
        "@type": "MenuSection",
        name: cat.name.en,
        hasMenuItem: menu.items
          .filter((i) => i.categoryId === cat.id)
          .map((i) => ({
            "@type": "MenuItem",
            name: i.name.en,
            description: i.description.en,
            offers: {
              "@type": "Offer",
              price: (i.priceCents / 100).toFixed(2),
              priceCurrency: "USD",
            },
          })),
      })),
    },
  };
}

export default async function StorefrontMenuPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("storefront");

  const store = getStore();
  const restaurant = await store.getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const menu = await store.getMenu(restaurant.id);
  if (!menu) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantJsonLd(restaurant, menu)),
        }}
      />
      {/* cover + identity */}
      <section className="pt-4">
        {restaurant.coverUrl && (
          <div className="relative h-40 overflow-hidden rounded-card sm:h-52">
            <Image
              src={restaurant.coverUrl}
              alt=""
              fill
              priority
              className="object-cover"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-4">
          <h1 className="text-2xl font-bold text-charcoal sm:text-3xl">
            {restaurant.name[loc]}
          </h1>
          {restaurant.halal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-3 py-1 text-xs font-bold text-positive">
              <BadgeCheck className="size-3.5" aria-hidden />
              {t("halal")}
            </span>
          )}
        </div>
        <p className="mt-1 text-stone">{restaurant.tagline[loc]}</p>
      </section>

      <div className="pt-4">
        <MenuBrowser slug={slug} menu={menu} />
      </div>
      <FunnelBeacon slug={slug} step="view" />
    </>
  );
}
