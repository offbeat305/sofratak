import type { Metadata } from "next";
import { Manrope, IBM_Plex_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";
import "../globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

// Self-hosted: Google Fonts' CDN copy 404s from next/font/google (stale
// version). Variable file covers the 600–700 range we use.
const cormorant = localFont({
  src: "../../fonts/cormorant-garamond-latin.woff2",
  weight: "300 700",
  variable: "--font-cormorant",
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sofratak — Take Control. Own Your Growth.",
    template: "%s · Sofratak",
  },
  description:
    "Sofratak helps restaurant owners save time, reduce unnecessary costs, and manage orders, customers, marketing, reporting, and operations from one place.",
  openGraph: {
    siteName: "Sofratak",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${manrope.variable} ${cormorant.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-dvh bg-ivory font-sans text-charcoal antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
