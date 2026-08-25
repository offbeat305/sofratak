import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Search, Star, ShoppingBag, Users } from "lucide-react";
import { EatStatsStrip } from "@/components/eat/eat-stats-strip";
import { GraderExperience } from "@/components/marketing/grader-experience";
import { Reveal } from "@/components/marketing/reveal";
import { localeAlternates, SITE_URL } from "@/lib/seo";

const CHECK_ICONS = [Search, Star, ShoppingBag, Users];

/** GEO/SEO: lets AI answer engines and Google cite this as a real, free tool. */
function graderJsonLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Sofratak Restaurant Grader",
    url: `${SITE_URL}/${locale}/grader`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any (web-based)",
    description:
      "Free tool that scores a restaurant's Google Business Profile, website, and online ordering setup, with an estimated monthly dollar impact.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

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
  const t = await getTranslations("site.grader");
  return {
    title: t("title"),
    description: t("sub"),
    alternates: localeAlternates(locale, "/grader"),
  };
}

export default async function GraderPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.grader");
  const checks = t.raw("checks") as Array<{ title: string; body: string }>;
  const steps = t.raw("howSteps") as string[];
  const faq = t.raw("faq") as Array<{ q: string; a: string }>;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graderJsonLd(locale)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }}
      />

      <GraderExperience>
        {/* what we check — glass chips on the hero's dark tail */}
        <section className="bg-olive pb-16 text-ivory">
          <div className="mx-auto grid max-w-4xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {checks.map((check, i) => {
              const Icon = CHECK_ICONS[i] ?? Search;
              return (
                <Reveal key={check.title} delay={i * 80}>
                  <div className="glass-pill h-full rounded-card p-4">
                    <Icon className="size-5 text-brass brightness-150" aria-hidden />
                    <p className="mt-2 font-bold">{check.title}</p>
                    <p className="mt-1 text-sm text-ivory/70">{check.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* sample report teaser */}
        <section className="texture-dots bg-ivory">
          <div className="mx-auto grid max-w-4xl items-center gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
                {t("sampleTitle")}
              </h2>
              <p className="mt-2 text-lg text-stone">{t("sampleSub")}</p>
              <div className="mt-5">
                <EatStatsStrip />
              </div>
            </Reveal>
            <Reveal delay={120}>
              {/* angled mock report — deliberately blurred (it's a teaser) */}
              <div
                aria-hidden
                className="card-crisp glow-brass rotate-2 rounded-card bg-olive p-6 text-ivory"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-20">
                    <svg viewBox="0 0 80 80" className="size-full -rotate-90">
                      <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(247,242,232,0.15)" strokeWidth="7" />
                      <circle
                        cx="40" cy="40" r="33" fill="none" stroke="#a9792b" strokeWidth="7"
                        strokeLinecap="round" strokeDasharray={2 * Math.PI * 33}
                        strokeDashoffset={2 * Math.PI * 33 * 0.28}
                      />
                    </svg>
                    <span className="font-display absolute inset-0 flex items-center justify-center text-2xl font-bold">
                      B
                    </span>
                  </div>
                  <div className="flex-1 blur-[5px]">
                    <div className="h-3 w-3/4 rounded bg-ivory/40" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-ivory/25" />
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2.5 blur-[4px]">
                  <div className="h-3 w-full rounded bg-ivory/25" />
                  <div className="h-3 w-5/6 rounded bg-ivory/20" />
                  <div className="h-3 w-2/3 rounded bg-ivory/25" />
                </div>
                <div className="mt-5 h-9 w-40 rounded-btn bg-brass/80 blur-[2px]" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* how it works */}
        <section className="bg-sand/25">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">{t("howTitle")}</h2>
            </Reveal>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {steps.map((step, i) => (
                <Reveal key={step} delay={i * 80}>
                  <li className="card-crisp h-full list-none rounded-card bg-white p-5">
                    <span className="flex size-9 items-center justify-center rounded-full bg-olive font-bold text-ivory">
                      {i + 1}
                    </span>
                    <p className="mt-3 text-[15px] text-charcoal">{step}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ (schema above) */}
        <section className="texture-dots bg-ivory">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <Reveal>
              <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">{t("faqTitle")}</h2>
            </Reveal>
            <div className="mt-8 flex flex-col gap-3">
              {faq.map((item, i) => (
                <Reveal key={item.q} delay={i * 60}>
                  <details className="card-crisp group rounded-card bg-white">
                    <summary className="cursor-pointer list-none px-5 py-4 font-bold text-charcoal transition-colors group-open:text-olive">
                      {item.q}
                    </summary>
                    <p className="px-5 pb-5 text-[15px] text-charcoal">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* final CTA — back to the input */}
        <section className="relative bg-gradient-to-b from-olive-deep to-[#1E332A] text-ivory">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,242,232,0.07)_0%,transparent_65%)]"
          />
          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-20">
            <Reveal>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("finalCtaTitle")}</h2>
              <a
                href="#grader-hero"
                className="press btn-shine glow-brass glow-hover mt-7 inline-flex h-13 items-center rounded-btn bg-brass px-8 text-lg font-bold text-olive"
              >
                {t("finalCtaButton")}
              </a>
            </Reveal>
          </div>
        </section>
      </GraderExperience>
    </>
  );
}
