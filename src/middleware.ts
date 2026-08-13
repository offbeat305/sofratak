import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

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

export default function middleware(request: NextRequest) {
  const slug = tenantSlugFromHost(request.headers.get("host") ?? "");
  if (slug) {
    const { pathname } = request.nextUrl;
    const localeMatch = pathname.match(/^\/(en|ar)(\/.*)?$/);
    if (localeMatch) {
      const rest = localeMatch[2] ?? "";
      if (!rest.startsWith("/s/")) {
        const url = request.nextUrl.clone();
        url.pathname = `/${localeMatch[1]}/s/${slug}${rest}`;
        return NextResponse.rewrite(url);
      }
    }
    // No locale prefix yet — let next-intl redirect (host is preserved).
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
