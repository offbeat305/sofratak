import type { MetadataRoute } from "next";
import { CITIES } from "@/content/cities";
import { EAT_METROS } from "@/content/eat-metros";
import { listStories } from "@/lib/stories";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sofratak.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/pricing",
    "/calculator",
    "/grader",
    "/how-it-works",
    "/cities",
    "/about",
    "/demo",
  ];
  const cityPaths = CITIES.map((city) => `/cities/${city.slug}`);
  const eatPaths = ["/eat", ...EAT_METROS.map((m) => `/eat/${m.slug}`)];
  const storyPaths = ["/stories", ...(await listStories()).map((s) => `/stories/${s.slug}`)];

  return [...staticPaths, ...cityPaths, ...eatPaths, ...storyPaths].flatMap((path) =>
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
