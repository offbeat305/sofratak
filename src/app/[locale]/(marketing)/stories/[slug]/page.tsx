import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getStory, listStories } from "@/lib/stories";
import { localeAlternates, SITE_URL } from "@/lib/seo";
import { EAT_METROS } from "@/content/eat-metros";
import { Button } from "@/components/marketing/button";
import { StoryCard } from "@/components/stories/story-card";
import { ReadingProgress } from "@/components/stories/reading-progress";
import { ShareButtons } from "@/components/stories/share-buttons";
import { Toc } from "@/components/stories/toc";

export const revalidate = 3600;

export async function generateStaticParams() {
  const stories = await listStories();
  return stories.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = await getStory(slug, locale === "ar" ? "ar" : "en");
  if (!story) return {};
  return {
    title: story.title,
    description: story.description,
    alternates: localeAlternates(locale, `/stories/${slug}`),
    openGraph: {
      title: story.title,
      description: story.description,
      type: "article",
      publishedTime: story.date,
    },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale === "ar" ? "ar" : "en";
  const story = await getStory(slug, loc);
  if (!story) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site.stories");

  const all = await listStories(loc);
  const index = all.findIndex((s) => s.slug === slug);
  const prev = index >= 0 ? all[index + 1] : undefined; // older
  const next = index > 0 ? all[index - 1] : undefined; // newer
  const related = all.filter((s) => s.slug !== slug).slice(0, 3);
  const cityName = story.city ? EAT_METROS.find((m) => m.slug === story.city)?.name[loc] : null;

  const url = `${SITE_URL}/${locale}/stories/${slug}`;
  const dateFormat = new Intl.DateTimeFormat(loc === "ar" ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    // frontmatter dates are date-only ISO ("2026-08-24") — without this,
    // Date() parses them as UTC midnight and a viewer west of UTC sees
    // the day before.
    timeZone: "UTC",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.description,
    datePublished: story.date,
    author: { "@type": "Person", name: "Zizo (Ahmad Zeidan)" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: url,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("breadcrumbHome"), item: SITE_URL },
      { "@type": "ListItem", position: 2, name: t("title"), item: `${SITE_URL}/${locale}/stories` },
      { "@type": "ListItem", position: 3, name: story.title, item: url },
    ],
  };

  return (
    <div>
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* everything below the header stays dir="ltr" — stories are EN-first (Arabic per Zizo's review rule) */}
      <article dir="ltr" className="pt-24 pb-16 sm:pt-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-stone">
            <Link href="/stories" className="hover:text-olive">
              {t("title")}
            </Link>
            <ChevronRight className="size-3.5 text-stone/50" aria-hidden />
            <span className="truncate text-stone/70">{story.title}</span>
          </nav>

          <header className="mt-5">
            {cityName && (
              <span className="data-label rounded-full bg-olive/[0.06] px-2.5 py-1 text-olive/70">{cityName}</span>
            )}
            <h1 className="font-display mt-3 text-[34px] leading-[1.12] font-bold text-olive sm:text-[44px] lg:text-[52px]">
              {story.title}
            </h1>
            <p className="mt-3 text-lg text-stone">{story.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone">
              <span className="font-semibold text-charcoal">{t("byline", { author: t("author") })}</span>
              <span aria-hidden>·</span>
              <span>{dateFormat.format(new Date(story.date))}</span>
              <span aria-hidden>·</span>
              <span>{t("readMinutes", { n: story.readMinutes })}</span>
            </div>
            <div className="mt-4 lg:hidden">
              <ShareButtons
                url={url}
                title={story.title}
                whatsappLabel={t("shareWhatsapp")}
                copyLabel={t("shareCopy")}
                copiedLabel={t("shareCopied")}
                xLabel={t("shareX")}
              />
            </div>
            <div className="mt-6 h-px w-16 bg-brass" />
          </header>

          <div className="mt-6">
            <Toc items={story.toc} label={t("tocLabel")} variant="mobile" />
          </div>
        </div>

        <ShareButtons
          floating
          url={url}
          title={story.title}
          whatsappLabel={t("shareWhatsapp")}
          copyLabel={t("shareCopy")}
          copiedLabel={t("shareCopied")}
          xLabel={t("shareX")}
        />

        <div className="mx-auto mt-8 grid max-w-3xl gap-10 px-4 sm:px-6 lg:max-w-5xl lg:grid-cols-[1fr_200px] lg:items-start">
          <div className="story-prose min-w-0 max-w-[68ch]" dangerouslySetInnerHTML={{ __html: story.html }} />
          <Toc items={story.toc} label={t("tocLabel")} variant="desktop" />
        </div>

        <div className="mx-auto mt-14 max-w-3xl px-4 sm:px-6">
          {/* author card */}
          <div className="card-crisp flex items-center gap-4 rounded-card bg-white p-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, not user content */}
            <img src="/brand/founder-zizo.png" alt="" className="size-14 shrink-0 rounded-full object-cover" />
            <div className="min-w-0">
              <p className="font-display font-bold text-olive">{t("author")}</p>
              <p className="mt-0.5 text-sm text-stone">{t("authorBio")}</p>
              <Link href="/about" className="mt-1 inline-block text-sm font-bold text-brass-deep underline-offset-4 hover:underline">
                {t("authorBioLink")} →
              </Link>
            </div>
          </div>

          {/* more stories */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl font-bold text-olive">{t("moreStoriesTitle")}</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-3">
                {related.map((r) => (
                  <StoryCard key={r.slug} story={r} locale={loc} readLabel={t("readMinutes", { n: r.readMinutes })} />
                ))}
              </div>
            </div>
          )}

          {/* soft CTA band */}
          <div className="grid-blueprint relative mt-12 overflow-hidden rounded-card bg-olive px-6 py-8 text-center text-ivory sm:px-10">
            <div className="relative">
              <h2 className="font-display text-2xl font-bold">{t("ctaTitle")}</h2>
              <p className="mt-1.5 text-ivory/75">{t("ctaSub")}</p>
              <Button href="/grader" className="mt-5">
                {t("ctaButton")}
              </Button>
            </div>
          </div>

          {/* prev / next */}
          {(prev || next) && (
            <nav className="mt-10 grid gap-3 border-t border-olive/10 pt-8 sm:grid-cols-2" aria-label="Article navigation">
              {prev ? (
                <Link href={`/stories/${prev.slug}`} className="hover-lift card-crisp flex items-center gap-2 rounded-card bg-white p-4">
                  <ChevronLeft className="size-4 shrink-0 text-stone" aria-hidden />
                  <div className="min-w-0">
                    <p className="data-label text-olive/45">{t("prevLabel")}</p>
                    <p className="truncate font-semibold text-charcoal">{prev.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {next && (
                <Link href={`/stories/${next.slug}`} className="hover-lift card-crisp flex items-center justify-end gap-2 rounded-card bg-white p-4 text-end sm:col-start-2">
                  <div className="min-w-0">
                    <p className="data-label text-olive/45">{t("nextLabel")}</p>
                    <p className="truncate font-semibold text-charcoal">{next.title}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-stone" aria-hidden />
                </Link>
              )}
            </nav>
          )}
        </div>
      </article>
    </div>
  );
}
