import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getStory, listStories } from "@/lib/stories";
import { localeAlternates, SITE_URL } from "@/lib/seo";

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
  const story = await getStory(slug);
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
  const story = await getStory(slug);
  if (!story) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site.stories");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.description,
    datePublished: story.date,
    author: { "@type": "Organization", name: "Sofratak" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}/${locale}/stories/${slug}`,
  };

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/stories" className="text-sm font-semibold text-stone hover:text-olive">
        ← {t("title")}
      </Link>

      {/* Stories are EN-first (Arabic per Zizo's review rule) */}
      <article dir="ltr" className="mt-4">
        <p className="text-xs font-semibold tracking-wide text-brass-deep uppercase">
          {dateFormat.format(new Date(story.date))}
        </p>
        <h1 className="font-display mt-2 text-3xl leading-tight font-bold text-olive sm:text-4xl">
          {story.title}
        </h1>
        <div
          className="mt-8 text-[17px] leading-relaxed text-charcoal [&_a]:font-semibold [&_a]:text-brass-deep [&_a]:underline-offset-4 [&_a:hover]:underline [&_h2]:font-display [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-olive [&_hr]:my-10 [&_hr]:border-olive/15 [&_li]:mt-1.5 [&_p]:mt-5 [&_strong]:text-olive [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:ps-5"
          dangerouslySetInnerHTML={{ __html: story.html }}
        />
      </article>
    </div>
  );
}
