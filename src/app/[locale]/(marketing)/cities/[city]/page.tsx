import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/marketing/button";
import { ArchWatermark } from "@/components/marketing/arch-watermark";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { LiveDemo } from "@/components/marketing/live-demo";
import { Reveal } from "@/components/marketing/reveal";
import { TierCards } from "@/components/marketing/tier-cards";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";
import { CityDirectoryPreview } from "@/components/marketing/city-directory-preview";
import { CITIES, cityBySlug } from "@/content/cities";
import { FOUNDER_STORY } from "@/content/founder-story";
import { routing } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";

type Params = Promise<{ locale: string; city: string }>;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    CITIES.map((city) => ({ locale, city: city.slug })),
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, city: slug } = await params;
  const city = cityBySlug(slug);
  if (!city) return {};
  const loc = locale as "en" | "ar";
  const t = await getTranslations("site.citiesPage");
  return {
    title: t("h1", { city: city.name[loc] }),
    description: city.metaDescription[loc],
    alternates: localeAlternates(locale, `/cities/${slug}`),
    openGraph: {
      title: t("h1", { city: city.name[loc] }),
      description: city.metaDescription[loc],
    },
  };
}

export default async function CityPage({ params }: { params: Params }) {
  const { locale, city: slug } = await params;
  setRequestLocale(locale);
  const loc = locale as "en" | "ar";
  const city = cityBySlug(slug);
  if (!city) notFound();

  const t = await getTranslations("site");
  const cityName = city.name[loc];
  const faqs = [
    { q: t("citiesPage.cityFaqQ", { city: cityName }), a: t("citiesPage.cityFaqA", { city: cityName }) },
    ...(t.raw("citiesPage.faqs") as Array<{ q: string; a: string }>),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Sofratak. Commission-free online ordering for ${city.name.en} restaurants`,
        provider: {
          "@type": "LocalBusiness",
          name: "Sofratak (Offbeat Creative LLC)",
          address: { "@type": "PostalAddress", addressLocality: "Tampa", addressRegion: "FL", addressCountry: "US" },
        },
        areaServed: { "@type": "City", name: `${city.name.en}, ${city.state}` },
        serviceType: "Restaurant online ordering software",
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero — olive band with the honest local paragraph */}
      <section className="relative bg-olive pt-16 text-ivory">
        <ArchWatermark parallax={false} />
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <p className="text-xs font-semibold tracking-[0.18em] text-brass uppercase brightness-150">
            {t("citiesPage.eyebrow")} · {city.state}
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">
            {t("citiesPage.h1", { city: cityName })}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ivory/85">
            {city.scene[loc]}
          </p>

          {/* the local chips — every page genuinely different */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold tracking-wide text-sand uppercase">
              {t("citiesPage.knownFor")}:
            </span>
            {city.knownFor.map((chip) => (
              <span
                key={chip.en}
                className="rounded-full border border-ivory/35 px-3.5 py-1.5 text-xs font-semibold text-ivory/80"
              >
                {chip[loc]}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/calculator">{t("citiesPage.estimatorCta")}</Button>
            <Button href="/demo" variant="secondary" tone="dark">
              {t("nav.demo")}
            </Button>
          </div>
          <p className="mt-4 text-xs text-ivory/60">
            {t("math.line", { amount: "$3,000+" })} {t("math.estimated")}{" "}
            {t("disclaimer")}
          </p>
        </div>
      </section>

      {/* Real listings from our own directory (design-pass-7 §B) */}
      <CityDirectoryPreview citySlug={city.slug} cityName={city.name.en} />

      {/* Live demo — the real product, on every city page */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-20">
          <Reveal>
            <LiveDemo />
          </Reveal>
        </div>
      </section>

      {/* Community + founder trust — sand */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <p className="text-xs font-bold tracking-[0.18em] text-stone uppercase">
              {t("citiesPage.community")}
            </p>
            <p className="font-display mt-3 max-w-2xl text-3xl leading-snug font-bold text-olive sm:text-4xl">
              {t("who.line")}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-charcoal">
              <BadgeCheck className="size-4 shrink-0 text-positive" aria-hidden />
              {t("citiesPage.communityLine")}
            </p>
            {loc === "en" && (
              <p className="mt-3 max-w-2xl text-sm text-stone">
                {FOUNDER_STORY.reuse.cityTrust}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      {/* Capability grid — ivory */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight font-bold text-olive sm:text-4xl">
              {t("grid.title")}
            </h2>
            <p className="mt-1 text-stone">{t("grid.sub")}</p>
          </Reveal>
          <div className="mt-8">
            <FeatureGrid />
          </div>
        </div>
      </section>

      {/* Pricing — sand */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight font-bold text-olive sm:text-4xl">
              {t("citiesPage.pricingTitle", { city: cityName })}
            </h2>
            <p className="mt-1 text-stone">
              {t("pricingTeaser.line", { price: "$249" })}
            </p>
          </Reveal>
          <div className="mt-10">
            <TierCards />
          </div>
        </div>
      </section>

      {/* FAQ — ivory (city question first) */}
      <section className="bg-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight font-bold text-olive sm:text-4xl">
              {t("citiesPage.faqTitle")}
            </h2>
          </Reveal>
          <dl className="mt-8 grid max-w-4xl gap-x-10 gap-y-6 md:grid-cols-2">
            {faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={(i % 4) * 60}>
                <div>
                  <dt className="font-bold text-charcoal">{faq.q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-stone">
                    {faq.a}
                  </dd>
                </div>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA + other cities — olive gradient */}
      <section className="relative bg-gradient-to-b from-olive to-olive-deep text-ivory">
        <ArchWatermark parallax={false} />
        <div className="relative mx-auto max-w-[1200px] px-4 py-14 text-center sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-[40px]">
              {t("finalCta.title")}
            </h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button href="/calculator" size="lg">{t("finalCta.estimator")}</Button>
              <WhatsAppLink />
            </div>
            <p className="mt-10 text-xs font-bold tracking-wide text-sand uppercase">
              {t("citiesPage.otherCities")}
            </p>
            <p className="mx-auto mt-3 flex max-w-3xl flex-wrap justify-center gap-x-4 gap-y-1.5">
              {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
                <Link
                  key={c.slug}
                  href={`/cities/${c.slug}`}
                  className="text-sm font-semibold text-ivory/70 underline-offset-4 hover:text-ivory hover:underline"
                >
                  {c.name[loc]}
                </Link>
              ))}
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
