import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Verification builds run with NEXT_DIST_DIR=.next-build so `next build`
  // never clobbers the .next a live dev server is serving from (that
  // collision corrupts the dev server: "Cannot find module './NNNN.js'").
  // Unset in dev and on Vercel → default ".next".
  ...(process.env.NEXT_DIST_DIR && { distDir: process.env.NEXT_DIST_DIR }),
  experimental: {
    serverActions: {
      // Menu photo uploads go through a server action; the default 1MB
      // cap rejects real phone photos with a 413 before our own 4MB
      // check ever runs. 5MB = 4MB app limit + multipart overhead.
      bodySizeLimit: "5mb",
    },
  },
  images: {
    // demo menu images are our own static SVGs
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // uploaded images live in Supabase Storage (menu photos + banners)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/menu-images/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/restaurant-images/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // The mobile API is cookie-less, unauthenticated-by-design (guest
        // checkout; possession of an order UUID is the credential), and
        // already rate-limited — CORS here is dev convenience for the
        // app's web smoke-test target, not a security boundary. Native
        // clients never send Origin at all.
        source: "/api/mobile/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "content-type" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          // 'self' (not DENY): the homepage live-demo iframes the
          // storefront from the same origin. A full CSP is a follow-up —
          // this ships the high-value directives without an inline-script
          // audit blocking launch.
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
