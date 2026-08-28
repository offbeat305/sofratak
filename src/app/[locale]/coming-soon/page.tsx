import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { COMING_SOON_COPY } from "@/content/coming-soon";
import { ComingSoonEmailForm } from "./email-form";

export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sofratak — Coming Soon",
    description: COMING_SOON_COPY.sub,
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
  const copyright = COMING_SOON_COPY.copyright.replace("{year}", String(new Date().getFullYear()));

  return (
    <div className="texture-dots flex min-h-dvh flex-col items-center justify-center bg-ivory px-4 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, not next/image-worthy for a one-off wall page */}
      <img src="/brand/logo-full.png" alt="Sofratak" width={240} height={55} className="h-11 w-auto sm:h-12" />

      {/* dir="ltr" pinned here regardless of page locale — this copy is
          English-only until Zizo reviews an Arabic version (see
          src/content/coming-soon.ts), and leaving it to inherit the
          page's dir="rtl" on /ar reorders its punctuation (bidi). */}
      <div dir="ltr" className="relative mt-10 sm:mt-12">
        <div className="glow-brass absolute inset-x-4 inset-y-2 -z-10 rounded-full" aria-hidden />
        <h1 className="font-[family-name:var(--font-cormorant)] max-w-2xl text-[34px] leading-[1.15] font-semibold text-olive sm:text-5xl">
          {COMING_SOON_COPY.headline}
        </h1>
      </div>

      <p dir="ltr" className="mt-5 max-w-md text-[15px] text-stone sm:text-lg">
        {COMING_SOON_COPY.sub}
      </p>

      <div className="mt-8 w-full max-w-md">
        <ComingSoonEmailForm />
      </div>

      <footer className="mt-16 flex flex-col items-center gap-3 text-sm text-stone">
        <LocaleSwitcher className="text-stone hover:text-olive" />
        <p dir="ltr">{copyright}</p>
      </footer>
    </div>
  );
}
