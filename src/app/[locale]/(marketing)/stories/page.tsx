import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listStories } from "@/lib/stories";
import { localeAlternates } from "@/lib/seo";

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
  const stories = await listStories();

  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-28 pb-14 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-olive sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-stone">{t("sub")}</p>

      <div className="mt-10 flex flex-col gap-8">
        {stories.map((story) => (
          <article key={story.slug} className="border-b border-olive/10 pb-8 last:border-0">
            <p className="text-xs font-semibold tracking-wide text-brass-deep uppercase">
              {dateFormat.format(new Date(story.date))}
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-olive">
              <Link href={`/stories/${story.slug}`} className="hover:text-brass-deep">
                {story.title}
              </Link>
            </h2>
            <p className="mt-2 text-[15px] text-charcoal">{story.description}</p>
            <Link
              href={`/stories/${story.slug}`}
              className="mt-3 inline-block text-sm font-bold text-brass-deep underline-offset-4 hover:underline"
            >
              {t("readStory")} →
            </Link>
          </article>
        ))}
        {stories.length === 0 && <p className="text-stone">{t("empty")}</p>}
      </div>
    </div>
  );
}
