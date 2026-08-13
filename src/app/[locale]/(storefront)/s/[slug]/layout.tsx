import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getStore } from "@/lib/db/store";
import { CartProvider } from "@/components/storefront/cart-context";
import {
  StorefrontFooter,
  StorefrontHeader,
} from "@/components/storefront/storefront-chrome";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const restaurant = await getStore().getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  return (
    <div
      className="min-h-dvh bg-ivory"
      style={
        {
          "--sf-primary": restaurant.brand.primary,
          "--sf-accent": restaurant.brand.accent,
        } as React.CSSProperties
      }
    >
      <CartProvider slug={slug}>
        <StorefrontHeader restaurant={restaurant} locale={locale as "en" | "ar"} />
        <main className="mx-auto max-w-3xl px-4">{children}</main>
        <StorefrontFooter restaurant={restaurant} locale={locale as "en" | "ar"} />
      </CartProvider>
    </div>
  );
}
