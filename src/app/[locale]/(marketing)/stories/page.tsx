import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { listStories } from "@/lib/stories";
import { localeAlternates } from "@/lib/seo";
import { StoryCard } from "@/components/stories/story-card";
import { StoriesGrid } from "@/components/stories/stories-grid";
import { NewsletterStrip } from "@/components/stories/newsletter-strip";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("site.stories");
  return {
    title: t("title"),
    description: t("sub"),
    alternates: localeAlternates(locale, "/stories"),
  };
}

export default async function StoriesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.stories");
  const loc = locale === "ar" ? "ar" : "en";
  const stories = await listStories(loc);

  const [featured, ...rest] = stories;
  const readLabel = (minutes: number) => t("readMinutes", { n: minutes });

  return (
    <div>
      {/* A. Hero band — no stock imagery, brand olive + blueprint grid */}
      <section className="grid-blueprint relative bg-olive pt-28 pb-16 text-ivory sm:pb-20">
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-ivory/75 sm:text-lg">{t("sub")}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
        {stories.length === 0 && <p className="text-stone">{t("empty")}</p>}

        {featured && (
          <StoryCard story={featured} locale={loc} readLabel={readLabel(featured.readMinutes)} featured />
        )}

        {rest.length > 0 && (
          <div className="mt-12">
            <StoriesGrid
              items={rest.map((story) => ({ story, readLabel: readLabel(story.readMinutes) }))}
              locale={loc}
              allLabel={t("allChip")}
              guidesLabel={t("guidesChip")}
              spotlightsLabel={t("spotlightsChip")}
              emptyLabel={t("emptyFiltered")}
            />
          </div>
        )}

        <NewsletterStrip />
      </div>
    </div>
  );
}
