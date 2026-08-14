import "server-only";
import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sofratak.com"
).replace(/\/$/, "");

/**
 * Canonical + hreflang alternates for a bilingual page. `path` is
 * locale-free (e.g. "/pricing", "" for home, "/cities/tampa").
 * Every marketing page should call this from generateMetadata so Google
 * never has to guess which locale is canonical for duplicate content.
 */
export function localeAlternates(locale: string, path: string): Metadata["alternates"] {
  const clean = path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages: {
      en: `${SITE_URL}/en${clean}`,
      ar: `${SITE_URL}/ar${clean}`,
      "x-default": `${SITE_URL}/en${clean}`,
    },
  };
}
