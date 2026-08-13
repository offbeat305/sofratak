import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CITIES } from "@/content/cities";
import { ArchDivider } from "@/components/marketing/arch-divider";
import { ArchWatermark } from "@/components/marketing/arch-watermark";
import { DollarComparison } from "@/components/marketing/dollar-comparison";
import { HeroCalculator } from "@/components/marketing/hero-calculator";
import { ProductTour } from "@/components/marketing/product-tour";
import { Reveal } from "@/components/marketing/reveal";
import { TierCards } from "@/components/marketing/tier-cards";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";

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
          "font-display text-4xl leading-tight font-semibold sm:text-[44px]",
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
      {/* 1 · Hero — the calculator IS the hero (olive) */}
      <section className="relative min-h-[88vh] bg-olive text-ivory">
        <ArchWatermark />
        {/* mobile order: headline → calculator (above the fold, per the
            done-when) → supporting copy; desktop: text column + card */}
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-x-12 gap-y-8 px-4 pt-24 pb-16 sm:px-6 md:pt-36 md:pb-28 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-brass uppercase brightness-150">
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-display mt-3 text-[clamp(34px,6vw,68px)] leading-[1.05] font-semibold">
              {t("hero.headline")}{" "}
              <span className="text-brass brightness-150">{t("hero.keep")}</span>
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
                  className="rounded-full border border-ivory/35 px-3.5 py-1.5 text-xs font-semibold text-ivory/75"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2 · Now-serving strip (ivory, thin) */}
      <section className="border-b border-olive/10 bg-ivory">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-5 sm:px-6">
          <span className="text-xs font-bold tracking-wide text-stone uppercase">
            {t("strip.now")}
          </span>
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/cities/${city.slug}`}
              className="text-sm font-semibold text-olive/80 underline-offset-4 hover:text-olive hover:underline"
            >
              {city.name[loc]}
            </Link>
          ))}
        </div>
      </section>

      {/* 3 · Where your $30 goes (sand band) */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("dollar.title")} sub={t("dollar.sub")} />
          <Reveal delay={80} className="mx-auto mt-10 max-w-2xl">
            <DollarComparison />
          </Reveal>
          <p className="mt-6 text-center text-xs text-stone">{t("disclaimer")}</p>
        </div>
      </section>

      {/* 4 · What you get (ivory) */}
      <section className="bg-ivory">
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
        </div>
      </section>

      {/* 5 · Product tour (olive) */}
      <section className="bg-olive">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <SectionHeader title={t("tour.title")} sub={t("tour.sub")} dark />
        </div>
        <Reveal className="pb-16 md:pb-24">
          <ProductTour />
        </Reveal>
      </section>

      {/* 6 · How it works (ivory) */}
      <section className="bg-ivory">
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

      {/* 7 · Who it's for (sand band) */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.18em] text-stone uppercase">
              {t("who.title")}
            </p>
            <p className="font-display mt-3 max-w-2xl text-3xl leading-snug font-semibold text-olive sm:text-4xl">
              {t("who.line")}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-positive">
              <BadgeCheck className="size-4" aria-hidden />
              {t("who.halal")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 8 · Pricing teaser (ivory) */}
      <section className="bg-ivory">
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

      {/* 9 · Data promise (olive) */}
      <section className="bg-olive text-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight font-semibold sm:text-[44px]">
              {t("promise.title")}
            </h2>
            <p className="mt-4 max-w-xl text-lg text-ivory/80">{t("promise.body")}</p>
          </Reveal>
          <Reveal delay={160}>
            <ArchDivider tone="sand" className="mt-10 justify-start" />
          </Reveal>
        </div>
      </section>

      {/* 10 · Final CTA (olive → deep gradient + watermark) */}
      <section className="relative bg-gradient-to-b from-olive to-olive-deep text-ivory">
        <ArchWatermark parallax={false} />
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 text-center sm:px-6 md:py-24">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold sm:text-[44px]">
              {t("finalCta.title")}
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/calculator"
                className="btn-shine inline-flex h-13 items-center rounded-btn bg-brass px-7 text-lg font-bold text-olive transition-transform duration-150 hover:scale-[1.03] motion-reduce:hover:scale-100"
              >
                {t("finalCta.estimator")}
              </Link>
              <WhatsAppLink />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
