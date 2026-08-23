import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sofratak.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/en/dashboard/",
        "/ar/dashboard/",
        "/en/admin",
        "/ar/admin",
        "/en/kitchen/",
        "/ar/kitchen/",
        "/en/styleguide",
        "/ar/styleguide",
        "/en/login",
        "/ar/login",
      ],
    },
    // GEO: no separate rules needed for AI answer-engine crawlers
    // (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) — the
    // default "*" allow already covers them. See /llms.txt for the
    // structured, crawler-friendly summary those bots prefer.
    sitemap: `${BASE}/sitemap.xml`,
  };
}
