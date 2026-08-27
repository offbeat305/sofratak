import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/marketing/button";
import { buttonClasses } from "@/components/ui/Button";
import { ArchDivider } from "@/components/marketing/arch-divider";
import { Reveal } from "@/components/marketing/reveal";
import { FOUNDER_STORY as S } from "@/content/founder-story";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const alternates = localeAlternates(locale, "/about");
  if (locale === "en") {
    return { title: S.meta.title, description: S.meta.description, alternates };
  }
  const t = await getTranslations("site.about");
  return { title: t("title"), alternates };
}

function Paragraphs({
  items,
  className = "text-[17px] leading-relaxed text-charcoal",
}: {
  items: readonly string[];
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {items.map((p) => (
        <p key={p.slice(0, 40)} className={className}>
          {p}
        </p>
      ))}
    </div>
  );
}

function Band({
  tone,
  children,
}: {
  tone: "ivory" | "sand" | "olive";
  children: React.ReactNode;
}) {
  const bg =
    tone === "olive" ? "bg-olive text-ivory" : tone === "sand" ? "bg-sand/25" : "bg-ivory";
  return (
    <section className={bg}>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">{children}</div>
    </section>
  );
}

function SectionTitle({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <h2
      className={`font-display mb-6 text-3xl leading-tight font-bold sm:text-4xl ${
        dark ? "text-ivory" : "text-olive"
      }`}
    >
      {title}
    </h2>
  );
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Arabic translation of the founder story is pending Zizo's review
  // (standing rule) — /ar/about keeps the approved short version.
  if (locale !== "en") {
    const t = await getTranslations("site");
    return (
      <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
        <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">
          {t("about.title")}
        </h1>
        <div className="relative mt-8 h-72 overflow-hidden rounded-card">
          <Image
            src="/brand/founder-zizo.png"
            alt={t("about.founder")}
            fill
            className="object-cover object-top"
          />
        </div>
        <div className="mt-8 flex flex-col gap-5 text-[17px] leading-relaxed text-charcoal">
          <p>{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
          <p className="font-semibold">{t("about.p3")}</p>
        </div>
        <p className="mt-8 font-bold text-olive">{t("about.founder")}</p>
        <ArchDivider className="mt-10" />
        <div className="mt-4 flex justify-center">
          <Link href="/demo" className={buttonClasses({ size: "lg" })}>
            {t("nav.demo")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero — olive band, large portrait */}
      <section className="olive-luminous relative bg-olive pt-16 text-ivory">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_minmax(280px,380px)] md:py-20">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-brass uppercase brightness-150">
              {S.hero.eyebrow}
            </p>
            <h1 className="font-display mt-3 text-4xl leading-tight font-bold sm:text-5xl">
              {S.hero.name}
            </h1>
            <p className="mt-2 text-lg font-semibold text-sand">{S.hero.subhead}</p>
            <div className="mt-7">
              <Paragraphs
                items={S.hero.lede}
                className="text-[17px] leading-relaxed text-ivory/85"
              />
            </div>
          </div>
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-[0_30px_70px_rgba(24,38,31,0.5)]">
              <Image
                src="/brand/founder-zizo.png"
                alt={S.hero.name}
                fill
                priority
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Built From the Other Side of the Table — ivory */}
      <Band tone="ivory">
        <Reveal>
          <SectionTitle title={S.otherSide.title} />
          <Paragraphs items={S.otherSide.intro} />
        </Reveal>
        {/* the fragmentation list — staggered per the implementation note */}
        <ul className="my-8 flex flex-col gap-2">
          {S.otherSide.fragments.map((line, i) => (
            <Reveal key={line} delay={i * 80}>
              <li className="rounded-field border border-olive/10 bg-white px-4 py-2.5 text-[15px] font-semibold text-charcoal">
                {line}
              </li>
            </Reveal>
          ))}
        </ul>
        <Reveal>
          <Paragraphs items={S.otherSide.outro} />
        </Reveal>
      </Band>

      {/* Community — sand */}
      <Band tone="sand">
        <Reveal>
          <SectionTitle title={S.community.title} />
          <Paragraphs items={S.community.paragraphs} />
        </Reveal>
      </Band>

      {/* Why Sofratak — ivory, with the pull-quote */}
      <Band tone="ivory">
        <Reveal>
          <SectionTitle title={S.why.title} />
          <blockquote className="font-display border-s-4 border-brass ps-5 text-2xl leading-snug font-bold text-olive italic sm:text-3xl">
            {S.why.pullQuote}
          </blockquote>
          <div className="mt-7">
            <Paragraphs items={S.why.paragraphs} />
          </div>
        </Reveal>
      </Band>

      {/* Slogan section — olive */}
      <Band tone="olive">
        <Reveal>
          <SectionTitle title={S.slogan.title} dark />
          <Paragraphs
            items={S.slogan.paragraphs}
            className="text-[17px] leading-relaxed text-ivory/85"
          />
        </Reveal>
      </Band>

      {/* Name explainer — ivory */}
      <Band tone="ivory">
        <Reveal>
          <SectionTitle title={S.name.title} />
          <Paragraphs items={S.name.paragraphs} />
        </Reveal>
      </Band>

      {/* Built for — sand */}
      <Band tone="sand">
        <Reveal>
          <SectionTitle title={S.builtFor.title} />
          <Paragraphs items={S.builtFor.paragraphs} />
        </Reveal>
      </Band>

      {/* Infrastructure — ivory */}
      <Band tone="ivory">
        <Reveal>
          <SectionTitle title={S.infrastructure.title} />
          <Paragraphs items={S.infrastructure.paragraphs} />
        </Reveal>
      </Band>

      {/* Vision — sand */}
      <Band tone="sand">
        <Reveal>
          <SectionTitle title={S.vision.title} />
          <Paragraphs items={S.vision.paragraphs} />
        </Reveal>
      </Band>

      {/* A Note From Ahmad — olive letter block with repeated photo */}
      <section className="olive-luminous relative bg-olive text-ivory">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
          <Reveal>
            <div className="rounded-card bg-olive-deep p-6 shadow-[0_24px_60px_rgba(20,30,25,0.4)] sm:p-10">
              <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-sand">
                  <Image
                    src="/brand/founder-zizo.png"
                    alt={S.note.signature}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <h2 className="font-display text-2xl font-bold text-sand sm:text-3xl">
                  {S.note.title}
                </h2>
              </div>
              <div className="font-display mt-7 flex flex-col gap-4 text-lg leading-relaxed text-ivory/90 italic">
                {S.note.paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
              <p className="mt-8 font-bold text-sand">{S.note.signature}</p>
              <p className="text-sm text-ivory/70">{S.note.signatureRole}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <ArchDivider tone="sand" className="mt-12" />
            <div className="mt-4 flex justify-center">
              <Button href="/demo">Book a Demo</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
