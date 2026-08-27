import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Minus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/marketing/button";
import { PricingSavings } from "@/components/marketing/pricing-savings";
import { CursorGlow } from "@/components/marketing/tech";
import { Reveal } from "@/components/marketing/reveal";
import { FOUNDER_STORY } from "@/content/founder-story";
import { localeAlternates } from "@/lib/seo";

type CompareRow = { label: string; us: string; apps: string; typical: string };
type FeeRow = { label: string; value: string };

function faqJsonLd(faq: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.pricing");
  return {
    title: t("title"),
    description: t("heroSub"),
    alternates: localeAlternates(locale, "/pricing"),
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.pricing");
  const rows = t.raw("compareRows") as CompareRow[];
  const fees = t.raw("feeRows") as FeeRow[];
  const faq = t.raw("faq") as Array<{ q: string; a: string }>;

  /** brass check for us, stone dash for a "no" */
  const cell = (value: string, strong = false) => {
    const negative = value === "n/a" || value === "No" || value === "لا" || value === "لا ينطبق";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-sm",
          strong ? "font-bold text-charcoal" : "text-stone",
        )}
      >
        {strong && !negative ? (
          <Check className="size-4 shrink-0 text-brass" aria-hidden />
        ) : negative ? (
          <Minus className="size-4 shrink-0 text-stone/50" aria-hidden />
        ) : null}
        {value}
      </span>
    );
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }}
      />

      {/* hero */}
      <section className="hero-ambient grid-blueprint relative bg-olive text-ivory">
        <CursorGlow />
        <div className="relative mx-auto max-w-3xl px-4 pt-28 pb-16 text-center sm:px-6 md:pt-36 md:pb-20">
          <p className="data-label text-brass brightness-150">{t("labelFee")}</p>
          <h1 className="font-display mt-3 text-[clamp(30px,5vw,52px)] leading-[1.08] font-bold">
            {t("heroH1")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ivory/75">{t("heroSub")}</p>
          {locale === "en" && (
            <Link
              href="/about"
              className="mt-6 inline-block rounded-full border border-sand/50 px-4 py-1.5 text-xs font-bold text-sand transition-colors hover:border-sand hover:text-ivory"
            >
              {FOUNDER_STORY.reuse.badge}
            </Link>
          )}
        </div>
      </section>

      {/* slider + tiers + included band */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <PricingSavings />
        </div>
      </section>

      {/* comparison table */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
              {t("compareTitle")}
            </h2>
            <p className="mt-1 text-stone">{t("compareSub")}</p>
          </Reveal>
          <Reveal delay={80}>
            {/* horizontal scroll keeps it readable at 390px */}
            <div className="card-crisp mt-8 overflow-x-auto rounded-card bg-white">
              <table className="w-full min-w-[640px] border-collapse text-start">
                <thead className="sticky top-0 z-10 bg-olive text-ivory">
                  <tr>
                    <th className="data-label px-4 py-3 text-start text-ivory/60">&nbsp;</th>
                    <th className="data-label px-4 py-3 text-start text-brass brightness-150">
                      {t("colUs")}
                    </th>
                    <th className="data-label px-4 py-3 text-start text-ivory/60">{t("colApps")}</th>
                    <th className="data-label px-4 py-3 text-start text-ivory/60">
                      {t("colTypical")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-olive/8">
                  {rows.map((row) => (
                    <tr key={row.label} className="align-top">
                      <th scope="row" className="px-4 py-3.5 text-start text-sm font-bold text-olive">
                        {row.label}
                      </th>
                      <td className="bg-brass/[0.05] px-4 py-3.5">{cell(row.us, true)}</td>
                      <td className="px-4 py-3.5">{cell(row.apps)}</td>
                      <td className="px-4 py-3.5">{cell(row.typical)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* fee transparency, styled as a receipt */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
              {t("feesTitle")}
            </h2>
            <p className="mt-1 text-stone">{t("feesSub")}</p>
          </Reveal>
          <Reveal delay={80}>
            <div className="card-crisp mt-8 rounded-card bg-white p-6 sm:p-8">
              <ul className="flex flex-col gap-3">
                {fees.map((fee) => (
                  <li key={fee.label} className="flex items-baseline justify-between gap-4">
                    <span className="text-[15px] text-charcoal">{fee.label}</span>
                    <span className="h-px flex-1 self-center border-b border-dashed border-olive/25" aria-hidden />
                    <span className="data-figure text-sm font-bold text-brass-deep" dir="ltr">
                      {fee.value}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="receipt-rule mt-5 pt-4 text-sm text-stone">{t("feeNote")}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
              {t("faqTitle")}
            </h2>
          </Reveal>
          <div className="mt-8 flex flex-col gap-3">
            {faq.map((item, i) => (
              <Reveal key={item.q} delay={i * 60}>
                <details className="card-crisp group rounded-card bg-white">
                  <summary className="cursor-pointer list-none px-5 py-4 font-bold text-charcoal transition-colors group-open:text-olive">
                    {item.q}
                  </summary>
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-charcoal">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* closing */}
      <section className="grid-blueprint relative bg-gradient-to-b from-olive-deep to-[#1E332A] text-ivory">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,242,232,0.07)_0%,transparent_65%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("closingTitle")}</h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button href="/demo" size="lg">{t("closingCta")}</Button>
              <Button href="/calculator" variant="secondary" tone="dark" size="lg">
                {t("closingGhost")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}
