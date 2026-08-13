import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { ArchDivider } from "@/components/marketing/arch-divider";
import { CITIES, cityBySlug } from "@/content/cities";
import { FOUNDER_STORY } from "@/content/founder-story";
import { routing } from "@/i18n/routing";

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
  const faqs = t.raw("citiesPage.faqs") as Array<{ q: string; a: string }>;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Sofratak — commission-free online ordering for ${city.name.en} restaurants`,
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
    <div className="mx-auto max-w-3xl px-4 pt-28 pb-14 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="font-display text-3xl leading-tight font-bold text-olive sm:text-4xl">
        {t("citiesPage.h1", { city: city.name[loc] })}
      </h1>

      {/* the honest local paragraph — the anti-boilerplate rule */}
      <p className="mt-5 text-[17px] leading-relaxed text-charcoal">{city.scene[loc]}</p>

      {/* math strip */}
      <div className="mt-8 rounded-card bg-olive p-6 text-center text-ivory">
        <p className="text-lg font-bold">
          {t("math.line", { amount: "$3,000+" })}{" "}
          <span className="text-sm font-semibold text-ivory/70">{t("math.estimated")}</span>
        </p>
        <Link
          href="/calculator"
          className={buttonClasses({ className: "mt-4" })}
        >
          {t("citiesPage.estimatorCta")}
        </Link>
        <p className="mt-3 text-xs text-ivory/60">{t("disclaimer")}</p>
      </div>

      {/* built for the community */}
      <div className="mt-8 rounded-card border border-olive/10 bg-sand-soft/50 p-6">
        <h2 className="text-sm font-bold tracking-wide text-stone uppercase">
          {t("citiesPage.community")}
        </h2>
        <p className="mt-2 font-semibold text-charcoal">{t("who.line")}</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-charcoal">
          <BadgeCheck className="size-4 shrink-0 text-positive" aria-hidden />
          {t("citiesPage.communityLine")}
        </p>
        {loc === "en" && (
          // founder-story trust line — generic version only (the per-city
          // client claim from the reuse map isn't verifiable per market)
          <p className="mt-3 border-t border-olive/10 pt-3 text-sm text-stone">
            {FOUNDER_STORY.reuse.cityTrust}
          </p>
        )}
      </div>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold text-olive">
          {t("citiesPage.faqTitle")}
        </h2>
        <dl className="mt-5 flex flex-col gap-5">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-bold text-charcoal">{faq.q}</dt>
              <dd className="mt-1 text-[15px] text-stone">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ArchDivider className="mt-10" />

      {/* other cities */}
      <section className="mt-4">
        <h2 className="text-sm font-bold tracking-wide text-stone uppercase">
          {t("citiesPage.otherCities")}
        </h2>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {CITIES.filter((c) => c.slug !== city.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/cities/${c.slug}`}
              className="text-sm font-semibold text-olive underline-offset-4 hover:underline"
            >
              {c.name[loc]}
            </Link>
          ))}
        </p>
      </section>
    </div>
  );
}
