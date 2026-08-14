"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Languages } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * The thing no competitor has: the REAL product, embedded live on the
 * marketing page. An actual Sofratak storefront in a phone frame —
 * scrollable, tappable, and flippable between English and Arabic.
 */
export function LiveDemo() {
  const t = useTranslations("site.live");
  const locale = useLocale() as "en" | "ar";
  // start in the visitor's language; the flip shows the OTHER one
  const [demoLocale, setDemoLocale] = useState<"en" | "ar">(locale);
  const flipped = demoLocale !== locale;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-brass-deep uppercase">
          {t("eyebrow")}
        </p>
        <h2 className="font-display mt-3 text-4xl leading-tight font-bold text-olive sm:text-[44px]">
          {t("title")}
        </h2>
        <p className="mt-3 max-w-md text-lg text-stone">{t("sub")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDemoLocale(flipped ? locale : locale === "en" ? "ar" : "en")}
            className="btn-shine inline-flex h-12 items-center gap-2 rounded-btn bg-olive px-6 font-bold text-ivory transition-transform duration-150 hover:scale-[1.02] motion-reduce:hover:scale-100"
          >
            <Languages className="size-4" aria-hidden />
            {flipped ? t("flipBack") : t("flip")}
          </button>
          <a
            href={`/${demoLocale}/s/beitzizo`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-btn border-[1.5px] border-olive px-6 font-bold text-olive transition-colors hover:bg-olive/5"
          >
            {t("open")}
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </div>
        <p className="mt-4 text-sm text-stone">{t("note")}</p>
      </div>

      {/* live storefront in a phone frame */}
      <div className="justify-self-center">
        <div
          className={cn(
            "overflow-hidden rounded-[2.6rem] border-[7px] border-charcoal/90 bg-charcoal/90 shadow-[0_30px_70px_rgba(24,38,31,0.35)] transition-transform duration-500",
            flipped && "animate-flip-in",
          )}
          key={demoLocale}
        >
          <iframe
            src={`/${demoLocale}/s/beitzizo`}
            title={t("title")}
            loading="lazy"
            className="block h-[560px] w-[300px] rounded-[2.1rem] bg-ivory sm:h-[620px] sm:w-[330px]"
          />
        </div>
      </div>
    </div>
  );
}
