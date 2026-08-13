import { getTranslations } from "next-intl/server";
import { AtSign, MapPin, Phone, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import type { Restaurant } from "@/lib/db/types";

export async function StorefrontHeader({
  restaurant,
  locale,
}: {
  restaurant: Restaurant;
  locale: "en" | "ar";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal/8 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
        <Link
          href={`/s/${restaurant.slug}`}
          className="flex min-w-0 items-center gap-2 font-bold text-[var(--sf-primary)]"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--sf-primary)] text-sm text-white">
            {restaurant.name.en.charAt(0)}
          </span>
          <span className="truncate">{restaurant.name[locale]}</span>
        </Link>
        <LocaleSwitcher className="shrink-0 text-charcoal hover:bg-charcoal/5" />
      </div>
    </header>
  );
}

export async function StorefrontFooter({
  restaurant,
  locale,
}: {
  restaurant: Restaurant;
  locale: "en" | "ar";
}) {
  const t = await getTranslations("storefront");
  const days = t.raw("days") as string[];

  return (
    <footer className="mt-12 border-t border-charcoal/8 bg-white">
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div className="flex flex-col gap-2 text-sm text-charcoal">
          <h2 className="text-base font-bold">{restaurant.name[locale]}</h2>
          <p className="flex items-center gap-2 text-stone">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(
                `${restaurant.address.line1}, ${restaurant.address.city}, ${restaurant.address.state} ${restaurant.address.zip}`,
              )}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[var(--sf-primary)]"
            >
              {restaurant.address.line1}, {restaurant.address.city},{" "}
              {restaurant.address.state} {restaurant.address.zip}
            </a>
          </p>
          <p className="flex items-center gap-2 text-stone">
            <Phone className="size-4 shrink-0" aria-hidden />
            <a href={`tel:${restaurant.phone}`} dir="ltr" className="hover:text-[var(--sf-primary)]">
              {restaurant.phone}
            </a>
          </p>
          <div className="mt-1 flex gap-4">
            {restaurant.instagramUrl && (
              <a
                href={restaurant.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-stone hover:text-[var(--sf-primary)]"
              >
                <AtSign className="size-4" aria-hidden /> Instagram
              </a>
            )}
            {restaurant.googleReviewsUrl && (
              <a
                href={restaurant.googleReviewsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-stone hover:text-[var(--sf-primary)]"
              >
                <Star className="size-4" aria-hidden /> Google
              </a>
            )}
          </div>
        </div>
        <div className="text-sm">
          <h2 className="text-base font-bold text-charcoal">{t("hours")}</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {restaurant.hours.map((h) => (
              <li key={h.day} className="flex justify-between gap-4 text-stone">
                <span>{days[h.day]}</span>
                <span dir="ltr" className="tabular-nums">
                  {h.open}–{h.close}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-charcoal/8">
        <p className="mx-auto max-w-3xl px-4 py-4 text-xs text-stone">
          {t("poweredBy")}
        </p>
      </div>
    </footer>
  );
}
