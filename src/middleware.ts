import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Phase 1 will extend this with {restaurant}.sofratak.com subdomain routing
// for the (storefront) group. For now it only handles locales.
export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
