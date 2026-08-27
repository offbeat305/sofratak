import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/marketing/button";
import { FOUNDER_STORY } from "@/content/founder-story";
import { NowServingStrip } from "@/components/eat/now-serving-strip";
import { localeAlternates } from "@/lib/seo";
import { ArchDivider } from "@/components/marketing/arch-divider";
import { ArchWatermark } from "@/components/marketing/arch-watermark";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { DollarComparison } from "@/components/marketing/dollar-comparison";
import { FaqSection } from "@/components/marketing/faq-section";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { HeroCalculator } from "@/components/marketing/hero-calculator";
import { LiveDemo } from "@/components/marketing/live-demo";
import { ProductTour } from "@/components/marketing/product-tour";
import { Reveal } from "@/components/marketing/reveal";
import { TierCards } from "@/components/marketing/tier-cards";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "سفرتك. طلبات أونلاين بدون عمولة لمطاعم العرب والحلال"
      : "Sofratak. Commission-Free Online Ordering for Arab & Halal Restaurants",
    description: isAr
      ? "موقع طلبات باسم مطعمك، بدون عمولة على الطعام. مبني للمطاعم العربية والشرق أوسطية والمتوسطية والحلال في فلوريدا وميشيغان."
      : "Your own restaurant ordering website with zero commission on food. Built for Arab, Middle Eastern, Mediterranean, and halal restaurants in Florida and Michigan. See your savings in seconds.",
    alternates: localeAlternates(locale, ""),
  };
}

function SectionHeader({
  title,
  sub,
  dark = false,
}: {
  title: string;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <Reveal>
      <h2
        className={cn2(
          "font-display text-4xl leading-tight font-bold sm:text-[44px]",
          dark ? "text-ivory" : "text-olive",
        )}
      >
        {title}
      </h2>
      {sub && (
        <p className={cn2("mt-2 text-lg", dark ? "text-ivory/70" : "text-stone")}>{sub}</p>
      )}
    </Reveal>
  );
}

function cn2(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const t = await getTranslations("site");

  const featureCards = t.raw("features.cards") as Array<{ title: string; body: string }>;
  const steps = t.raw("how.steps") as Array<{ title: string; body: string }>;
  const chips = t.raw("hero.chips") as string[];

  return (
    <>
      {/* 1 · Hero — the calculator IS the hero (dusk gradient + luminance) */}
      <section className="hero-ambient olive-luminous relative min-h-[88vh] bg-olive text-ivory">
        <ArchWatermark />
        {/* mobile order: headline → calculator (above the fold, per the
            done-when) → supporting copy; desktop: text column + card */}
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-x-12 gap-y-8 px-4 pt-24 pb-16 sm:px-6 md:pt-36 md:pb-28 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-brass uppercase brightness-150">
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display mt-3 text-[clamp(34px,6vw,68px)] leading-[1.05] font-bold">
              {t("hero.headline")}{" "}
              {/* the one gradient text on the whole page (design-pass-3 §2) */}
              <span className="gradient-text-brass">{t("hero.keep")}</span>
            </h1>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <HeroCalculator />
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <p className="max-w-lg text-lg text-ivory/80">{t("hero.sub")}</p>
            <p className="mt-4 text-sm font-semibold text-sand">
              {loc === "ar"
                ? "شغلك تحت سيطرتك · Take Control. Own Your Growth."
                : "Take Control. Own Your Growth. · شغلك تحت سيطرتك"}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="glass-pill rounded-full px-3.5 py-1.5 text-xs font-semibold text-ivory/85"
                >
                  {chip}
                </span>
              ))}
              {loc === "en" && (
                // credibility badge (founder-story reuse map) — EN until AR review
                <Link
                  href="/about"
                  className="rounded-full border border-sand/50 px-3.5 py-1.5 text-xs font-semibold text-sand transition-colors hover:border-sand hover:text-ivory"
                >
                  {FOUNDER_STORY.reuse.badge}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2 · Now-serving proof band (fix 1): real per-metro counts,
             replaces the old thin link-list strip */}
      <NowServingStrip />

      {/* 3 · Where your $30 goes — glass panel on lit dark olive
             (design-pass-3 §3) */}
      <section className="olive-luminous relative bg-olive">
        <div className="relative z-[2] mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("dollar.title")} sub={t("dollar.sub")} dark />
          <Reveal delay={80} className="mx-auto mt-10 max-w-2xl">
            <div className="edge-light rounded-card bg-ivory/90 p-6 backdrop-blur-md sm:p-8">
              <DollarComparison />
            </div>
          </Reveal>
          <p className="mt-6 text-center text-xs text-ivory/60">{t("disclaimer")}</p>
        </div>
      </section>

      {/* 4 · What you get (ivory + texture) */}
      <section className="texture-dots relative bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("features.title")} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 80}>
                <div className="hover-lift h-full rounded-card border border-olive/10 bg-white p-6 shadow-[0_1px_3px_rgba(31,31,31,0.05)]">
                  <h3 className="font-bold text-olive">{card.title}</h3>
                  <p className="mt-2 text-[15px] text-charcoal">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* full capability grid — live vs rolling-out, labeled honestly */}
          <Reveal className="mt-16">
            <h3 className="font-display text-2xl font-bold text-olive sm:text-3xl">
              {t("grid.title")}
            </h3>
            <p className="mt-1 text-stone">{t("grid.sub")}</p>
          </Reveal>
          <div className="mt-6">
            <FeatureGrid />
          </div>
        </div>
      </section>

      {/* 5 · Product tour (lit olive; watermark parallaxes behind devices) */}
      <section className="olive-luminous relative bg-olive">
        <ArchWatermark />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("tour.title")} sub={t("tour.sub")} dark />
        </div>
        <Reveal className="relative pb-16 md:pb-24">
          <ProductTour />
        </Reveal>
      </section>

      {/* 6 · LIVE demo — the real product, embedded (ivory + texture) */}
      <section className="texture-dots relative bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <LiveDemo />
          </Reveal>
        </div>
      </section>

      {/* 7 · Who it's for + founder block (one sand band — keeps the
             no-adjacent-same-color rhythm; founder-story reuse map) */}
      <section className="texture-dots bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.18em] text-stone uppercase">
              {t("who.title")}
            </p>
            <p className="font-display mt-3 max-w-2xl text-3xl leading-snug font-bold text-olive sm:text-4xl">
              {t("who.line")}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-positive">
              <BadgeCheck className="size-4" aria-hidden />
              {t("who.halal")}
            </p>
          </Reveal>

          {loc === "en" && (
            <Reveal delay={120}>
              <div className="mt-12 grid items-center gap-8 rounded-card border border-olive/10 bg-white p-6 sm:p-8 md:grid-cols-[auto_1fr]">
                <div className="relative size-28 shrink-0 overflow-hidden rounded-2xl md:size-36">
                  <Image
                    src="/brand/founder-zizo.png"
                    alt={FOUNDER_STORY.hero.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div>
                  <p className="font-bold text-olive">
                    {FOUNDER_STORY.reuse.homeBlurbTitle}
                  </p>
                  <p className="mt-2 text-[15px] text-charcoal">
                    {FOUNDER_STORY.reuse.homeBlurb}
                  </p>
                  <blockquote className="font-display mt-4 border-s-4 border-brass ps-4 text-xl leading-snug font-bold text-olive italic sm:text-2xl">
                    {FOUNDER_STORY.why.pullQuote}
                  </blockquote>
                  <Link
                    href="/about"
                    className="mt-4 inline-block text-sm font-bold text-brass-deep underline-offset-4 hover:underline"
                  >
                    {FOUNDER_STORY.reuse.homeLink}
                  </Link>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* 8 · How it works (ivory + texture) */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("how.title")} sub={t("how.note")} />
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <li className="hover-lift h-full list-none rounded-card border border-olive/10 bg-white p-6">
                  <span className="flex size-10 items-center justify-center rounded-full bg-olive font-bold text-ivory">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-bold text-charcoal">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-stone">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 9 · The apps vs your own site (sand + texture) */}
      <section className="texture-dots bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("compare.title")} sub={t("compare.sub")} />
          <div className="mt-10">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* 10 · Pricing teaser (ivory + texture) */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader
            title={t("pricing.title")}
            sub={t("pricingTeaser.line", { price: "$249" })}
          />
          <div className="mt-12">
            <TierCards />
          </div>
        </div>
      </section>

      {/* 11 · Data promise (lit olive) */}
      <section className="olive-luminous relative bg-olive text-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight font-bold sm:text-[44px]">
              {t("promise.title")}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-ivory/80">{t("promise.body")}</p>
          </Reveal>
          <Reveal delay={160}>
            <ArchDivider tone="sand" className="mt-10 justify-start" />
          </Reveal>
        </div>
      </section>

      {/* 12 · FAQ (ivory + texture) */}
      <section className="texture-dots relative bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("faq.title")} />
          <div className="mt-10">
            <FaqSection />
          </div>
        </div>
      </section>

      {/* 13 · Final CTA — darkest band, cinematic close (design-pass-3 §3) */}
      <section className="relative bg-gradient-to-b from-olive-deep to-[#1E332A] text-ivory">
        <ArchWatermark parallax={false} />
        {/* ivory radial glow behind the CTA cluster */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[560px] w-[860px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,242,232,0.07)_0%,transparent_65%)]"
        />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-6 md:py-24">
          <Reveal>
            <h2 className="font-display text-4xl font-bold sm:text-[44px]">
              {t("finalCta.title")}
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/calculator" size="lg">
                {t("finalCta.estimator")}
              </Button>
              <Button href="/grader" variant="secondary" tone="dark" size="lg">
                {t("finalCta.grader")}
              </Button>
              <WhatsAppLink />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
