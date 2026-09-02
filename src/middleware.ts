import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing, type Locale } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Launch gate (docs/launch-coming-soon-spec.md). One env var, read fresh
 * on every request (no build-time inlining) so Zizo can flip it in Vercel
 * without a redeploy. Runs before everything else — tenant storefronts
 * included, since "every request" means every request.
 */
const ADMIN_PATH_RE = /^\/(?:(?:en|ar)\/)?admin(\/|$)/;
const COMING_SOON_PATH_RE = /^\/(?:(?:en|ar)\/)?coming-soon(\/|$)/;
/**
 * Next's generated metadata-image routes (opengraph-image, twitter-image,
 * icon, apple-icon, with optional build-hash suffixes). Excluded from the
 * gate: crawlers resolving an og:image URL must get the image bytes, not
 * the rewritten coming-soon HTML — otherwise WhatsApp/social shares render
 * with no card image while the wall is up. These serve brand art only,
 * nothing sensitive to leak.
 */
const METADATA_IMAGE_RE = /\/(?:opengraph-image|twitter-image|icon|apple-icon)(?:-[a-z0-9]+)?\/?$/;

function localeFromPathname(pathname: string): Locale {
  const match = pathname.match(/^\/(en|ar)(\/|$)/);
  return match?.[1] === "ar" ? "ar" : routing.defaultLocale;
}

/** Paths that need a live session — token refresh happens here because
 * server components can't write cookies. */
const AUTH_PATH_RE = /\/(dashboard|kitchen|login)(\/|$)/;

async function refreshSession(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  await supabase.auth.getUser();
}

/** Subdomains that are never tenant storefronts. */
const RESERVED_SUBDOMAINS = new Set(["www", "app", "admin", "api"]);

/**
 * beitzizo.sofratak.com and beitzizo.localhost:3000 (works in Chrome with no
 * hosts-file setup) serve that restaurant's storefront. The path-based form
 * /{locale}/s/{slug} always works too.
 */
function tenantSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0];
  const match =
    hostname.match(/^([a-z0-9-]+)\.sofratak\.com$/) ??
    hostname.match(/^([a-z0-9-]+)\.localhost$/);
  if (!match) return null;
  const sub = match[1];
  return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
}

export default async function middleware(request: NextRequest) {
  if (process.env.MAINTENANCE_MODE === "true") {
    const { pathname } = request.nextUrl;
    if (
      !ADMIN_PATH_RE.test(pathname) &&
      !COMING_SOON_PATH_RE.test(pathname) &&
      !METADATA_IMAGE_RE.test(pathname)
    ) {
      const url = request.nextUrl.clone();
      url.pathname = `/${localeFromPathname(pathname)}/coming-soon`;
      // Rewrite, not redirect — the visitor's URL bar (sofratak.com,
      // beitzizo.sofratak.com, whatever they typed) never changes, so
      // flipping the var back off later is instant and invisible.
      return NextResponse.rewrite(url);
    }
  }

  let response: NextResponse | undefined;

  const slug = tenantSlugFromHost(request.headers.get("host") ?? "");
  if (slug) {
    const { pathname } = request.nextUrl;
    const localeMatch = pathname.match(/^\/(en|ar)(\/.*)?$/);
    if (localeMatch) {
      const rest = localeMatch[2] ?? "";
      if (!rest.startsWith("/s/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/${localeMatch[1]}/s/${slug}${rest}`;
        response = NextResponse.rewrite(url);
      }
    }
    // No locale prefix yet — let next-intl redirect (host is preserved).
  }

  response ??= intlMiddleware(request);

  if (AUTH_PATH_RE.test(request.nextUrl.pathname)) {
    await refreshSession(request, response);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
