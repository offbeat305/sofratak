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

/**
 * Private preview pass (Zizo, Oct 2026): lets the owner see the real site —
 * marketing pages, /eat directory, tenant storefronts — while the wall is up
 * for everyone else. Off unless PREVIEW_PASS (16+ chars) is set in Vercel.
 *
 *   any page + ?preview=<PREVIEW_PASS>  → sets an httpOnly cookie (30 days)
 *   any page + ?preview=off              → clears it
 *
 * The cookie is scoped to .sofratak.com so tenant subdomains pass too. A
 * wrong value just strips the param (no hint it exists). Bypassed responses
 * carry X-Robots-Tag: noindex — crawlers never hold the cookie anyway.
 */
const PREVIEW_COOKIE = "sofratak_preview";
const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30;

function previewCookieDomain(host: string): string | undefined {
  const hostname = host.split(":")[0];
  return hostname === "sofratak.com" || hostname.endsWith(".sofratak.com")
    ? ".sofratak.com"
    : undefined;
}

export default async function middleware(request: NextRequest) {
  const previewPass = process.env.PREVIEW_PASS;
  const previewEnabled = !!previewPass && previewPass.length >= 16;
  let previewing = false;

  if (process.env.MAINTENANCE_MODE === "true") {
    const { pathname } = request.nextUrl;

    const previewParam = request.nextUrl.searchParams.get("preview");
    if (previewEnabled && previewParam !== null) {
      const clean = request.nextUrl.clone();
      clean.searchParams.delete("preview");
      const res = NextResponse.redirect(clean);
      const domain = previewCookieDomain(request.headers.get("host") ?? "");
      const secure = request.nextUrl.protocol === "https:";
      if (previewParam === previewPass) {
        res.cookies.set(PREVIEW_COOKIE, previewPass, {
          httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: PREVIEW_MAX_AGE, domain,
        });
      } else if (previewParam === "off") {
        res.cookies.set(PREVIEW_COOKIE, "", { path: "/", maxAge: 0, domain });
      }
      return res;
    }

    previewing = previewEnabled && request.cookies.get(PREVIEW_COOKIE)?.value === previewPass;

    if (
      !previewing &&
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
  if (previewing) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
