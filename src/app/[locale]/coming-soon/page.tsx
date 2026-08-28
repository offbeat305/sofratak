import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { COMING_SOON_COPY } from "@/content/coming-soon";
import { ComingSoonEmailForm } from "./email-form";

export const revalidate = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = locale === "ar" ? COMING_SOON_COPY.ar : COMING_SOON_COPY.en;
  return {
    title: "Sofratak — Coming Soon",
    description: copy.sub,
    // Temporary wall, not a real page — never index this over the real site.
    robots: { index: false, follow: false },
  };
}

/**
 * The launch gate's only page (docs/launch-coming-soon-spec.md). Lives
 * outside (marketing) on purpose — no Navbar/Footer/Assistant/sticky-CTA,
 * this is a wall, not a mini-site. src/middleware.ts rewrites everything
 * except /admin and /api here while MAINTENANCE_MODE=true.
 */
export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = locale === "ar" ? COMING_SOON_COPY.ar : COMING_SOON_COPY.en;
  const copyright = copy.copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <div className="texture-dots flex min-h-dvh flex-col items-center justify-center bg-ivory px-4 py-10 text-center">
      {/* Full lockup (icon + EN wordmark + AR wordmark + tagline) — bigger
          than the header logo on purpose, this is the whole page. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, not next/image-worthy for a one-off wall page */}
      <img
        src="/brand/logo-coming-soon.png"
        alt="Sofratak — Take Control. Own Your Growth."
        width={904}
        height={319}
        className="h-16 w-auto sm:h-20"
      />

      {/* EN/AR now both approved (Zizo, Aug 2026) — no more dir="ltr"
          pinning, this follows the page's natural direction (RTL on /ar)
          like everything else on the site. */}
      <div className="relative mt-10 sm:mt-12">
        <div className="glow-brass absolute inset-x-4 inset-y-2 -z-10 rounded-full" aria-hidden />
        <h1 className="font-display max-w-2xl text-[34px] leading-[1.1] font-bold tracking-tight text-olive sm:text-5xl">
          {copy.headline}
        </h1>
      </div>

      <p className="mt-5 max-w-md text-[15px] text-stone sm:text-lg">{copy.sub}</p>

      <div className="mt-8 w-full max-w-md">
        <ComingSoonEmailForm />
      </div>

      <footer className="mt-16 flex flex-col items-center gap-3 text-sm text-stone">
        <LocaleSwitcher className="text-stone hover:text-olive" />
        <p>{copyright}</p>
      </footer>
    </div>
  );
}
