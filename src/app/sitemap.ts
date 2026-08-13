import type { MetadataRoute } from "next";
import { CITIES } from "@/content/cities";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sofratak.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    "",
    "/pricing",
    "/calculator",
    "/how-it-works",
    "/cities",
    "/about",
    "/demo",
  ];
  const cityPaths = CITIES.map((city) => `/cities/${city.slug}`);

  return [...staticPaths, ...cityPaths].flatMap((path) =>
    (["en", "ar"] as const).map((locale) => ({
      url: `${BASE}/${locale}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : path.startsWith("/cities/") ? 0.8 : 0.9,
      alternates: {
        languages: {
          en: `${BASE}/en${path}`,
          ar: `${BASE}/ar${path}`,
        },
      },
    })),
  );
}
