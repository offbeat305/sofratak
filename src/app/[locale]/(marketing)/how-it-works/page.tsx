import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HowTimeline } from "@/components/marketing/how-timeline";
import { KitchenFeed } from "@/components/marketing/kitchen-feed";
import { Reveal } from "@/components/marketing/reveal";
import { localeAlternates } from "@/lib/seo";

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
  const t = await getTranslations("site.how");
  return {
    title: t("title"),
    description: t("heroSub"),
    alternates: localeAlternates(locale, "/how-it-works"),
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.how");
  const weHandle = t.raw("weHandleItems") as string[];
  const youHandle = t.raw("youHandleItems") as string[];
  const dontNeed = t.raw("dontNeed") as string[];
  const faq = t.raw("faq") as Array<{ q: string; a: string }>;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faq)) }}
      />

      {/* 1 · hero */}
      <section className="hero-ambient olive-luminous relative bg-olive text-ivory">
        <div className="relative mx-auto max-w-3xl px-4 pt-28 pb-16 text-center sm:px-6 md:pt-36 md:pb-20">
          <h1 className="font-display text-[clamp(30px,5vw,52px)] leading-[1.08] font-bold">
            {t("heroH1")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ivory/75">{t("heroSub")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/demo"
              className="press btn-shine glow-brass glow-hover inline-flex h-13 items-center rounded-btn bg-brass px-7 text-lg font-bold text-ivory"
            >
              {t("heroCta")}
            </Link>
            <Link
              href="/calculator"
              className="press inline-flex h-13 items-center rounded-btn border border-ivory/40 px-7 text-lg font-bold text-ivory transition-colors hover:bg-ivory/10"
            >
              {t("heroCtaGhost")}
            </Link>
          </div>
          <p className="mt-6 text-sm font-semibold text-sand">{t("trustRow")}</p>
        </div>
      </section>

      {/* 2 · the scroll-scrubbed timeline */}
      <HowTimeline />

      {/* 3 · who does what */}
      <section className="olive-luminous relative bg-olive-deep text-ivory">
        <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 md:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("splitTitle")}</h2>
            <p className="mt-1 text-ivory/70">{t("splitSub")}</p>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <div className="glass-pill edge-light h-full rounded-card p-6 sm:p-8">
                <p className="text-xs font-extrabold tracking-[0.18em] text-brass uppercase brightness-150">
                  {t("weHandle")}
                </p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {weHandle.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px]">
                      <Check className="mt-0.5 size-4.5 shrink-0 text-brass brightness-150" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="mt-6 inline-block text-sm font-bold text-sand underline-offset-4 hover:underline"
                >
                  {t("requestsLink")} →
                </Link>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="glass-pill h-full rounded-card p-6 sm:p-8">
                <p className="text-xs font-extrabold tracking-[0.18em] text-ivory/60 uppercase">
                  {t("youHandle")}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5">
                  {youHandle.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[15px]">
                      <Check className="mt-0.5 size-4.5 shrink-0 text-ivory/50" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4 · kitchen view */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
              {t("kitchenTitle")}
            </h2>
            <p className="mt-3 text-lg text-stone">{t("kitchenSub")}</p>
            <p className="mt-5 rounded-card bg-sand-soft/60 p-4 text-sm font-semibold text-charcoal">
              {t("kitchenFallback")}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <KitchenFeed />
          </Reveal>
        </div>
      </section>

      {/* 5 · what you don't need */}
      <section className="bg-sand/25">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-olive sm:text-3xl">
              {t("dontNeedTitle")}
            </h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {dontNeed.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-olive/15 bg-white px-4 py-2 text-[15px] font-semibold text-stone line-through decoration-clay/70 decoration-2"
                >
                  <X className="size-4 shrink-0 text-clay no-underline" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-stone">{t("dontNeedNote")}</p>
          </Reveal>
        </div>
      </section>

      {/* 6 · onboarding FAQ */}
      <section className="texture-dots bg-ivory">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
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

      {/* 7 · closing */}
      <section className="relative bg-gradient-to-b from-olive-deep to-[#1E332A] text-ivory">
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(247,242,232,0.07)_0%,transparent_65%)]"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-20">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("closingTitle")}</h2>
            <Link
              href="/demo"
              className="press btn-shine glow-brass glow-hover mt-7 inline-flex h-13 items-center rounded-btn bg-brass px-8 text-lg font-bold text-ivory"
            >
              {t("closingCta")}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
