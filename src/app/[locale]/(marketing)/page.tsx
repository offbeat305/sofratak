import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { ArchDivider } from "@/components/marketing/arch-divider";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import { WhatsAppLink } from "@/components/marketing/whatsapp-link";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site");

  const featureCards = t.raw("features.cards") as Array<{ title: string; body: string }>;
  const steps = t.raw("how.steps") as Array<{ title: string; body: string }>;

  return (
    <>
      {/* 1 · Hero */}
      <section className="bg-olive text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            {/* both slogans together, per the spec — they're brand constants */}
            <p className="text-sm font-bold tracking-wide text-sand">
              {locale === "ar"
                ? "شغلك تحت سيطرتك · Take Control. Own Your Growth."
                : "Take Control. Own Your Growth. · شغلك تحت سيطرتك"}
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight font-bold sm:text-5xl lg:text-6xl">
              {t("hero.headline")}
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ivory/85">{t("hero.sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/calculator" className={buttonClasses({ size: "lg" })}>
                {t("nav.estimator")}
              </Link>
              {/* explicit classes: cn() doesn't merge, and the secondary
                  variant's olive border/text vanish on the olive hero */}
              <Link
                href="/demo"
                className="inline-flex h-12 items-center justify-center rounded-btn border-[1.5px] border-ivory px-7 font-semibold text-ivory transition-colors hover:bg-ivory/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
              >
                {t("nav.demo")}
              </Link>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* 2 · Math strip */}
      <section className="border-b border-olive/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-6 text-center sm:px-6">
          <p className="text-lg font-bold text-charcoal sm:text-xl">
            {t("math.line", { amount: "$3,000+" })}{" "}
            <span className="text-sm font-semibold text-stone">{t("math.estimated")}</span>
          </p>
          <Link
            href="/calculator"
            className="text-lg font-bold text-brass-deep underline-offset-4 hover:underline"
          >
            {t("math.cta")} ←
          </Link>
        </div>
        <p className="pb-4 text-center text-xs text-stone">{t("disclaimer")}</p>
      </section>

      {/* 3 · What you get */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-olive sm:text-4xl">
          {t("features.title")}
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-card border border-olive/10 bg-white p-6 shadow-[0_1px_3px_rgba(31,31,31,0.05)] transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(31,31,31,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <h3 className="font-bold text-olive">{card.title}</h3>
              <p className="mt-2 text-[15px] text-charcoal">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      <ArchDivider />

      {/* 4 · How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center font-display text-3xl font-bold text-olive sm:text-4xl">
          {t("how.title")}
        </h2>
        <ol className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="text-center">
              <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-olive font-bold text-ivory">
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold text-charcoal">{step.title}</h3>
              <p className="mt-1.5 text-sm text-stone">{step.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-sm font-semibold text-stone">{t("how.note")}</p>
      </section>

      {/* 5 · Who it's for */}
      <section className="bg-sand-soft/60">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
          <h2 className="text-sm font-bold tracking-wide text-stone uppercase">{t("who.title")}</h2>
          <p className="mt-3 font-display text-2xl font-bold text-olive sm:text-3xl">
            {t("who.line")}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-positive">
            <BadgeCheck className="size-4" aria-hidden />
            {t("who.halal")}
          </p>
        </div>
      </section>

      {/* 6 · Pricing teaser */}
      <section className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
        <p className="text-lg font-bold text-charcoal">
          {t("pricingTeaser.line", { price: "$249" })}
        </p>
        <Link
          href="/pricing"
          className={buttonClasses({ variant: "secondary", className: "mt-5" })}
        >
          {t("pricingTeaser.cta")}
        </Link>
      </section>

      {/* 7 · Promise block */}
      <section className="bg-olive text-ivory">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("promise.title")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ivory/85">{t("promise.body")}</p>
        </div>
      </section>

      {/* 8 · Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold text-olive sm:text-4xl">
          {t("finalCta.title")}
        </h2>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/calculator" className={buttonClasses({ size: "lg" })}>
            {t("finalCta.estimator")}
          </Link>
          <WhatsAppLink />
        </div>
      </section>
    </>
  );
}
