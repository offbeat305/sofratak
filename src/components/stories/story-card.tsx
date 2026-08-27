import { Link } from "@/i18n/navigation";
import { EAT_METROS } from "@/content/eat-metros";
import type { Story } from "@/lib/stories";
import { StoryCover } from "./story-cover";

function metroName(citySlug: string | null, locale: "en" | "ar"): string | null {
  if (!citySlug) return null;
  return EAT_METROS.find((m) => m.slug === citySlug)?.name[locale] ?? null;
}

export function StoryCard({
  story,
  locale,
  readLabel,
  featured = false,
}: {
  story: Story;
  locale: "en" | "ar";
  /** already-translated, e.g. "4 min read" — kept a plain string so this component works from client filter state too */
  readLabel: string;
  featured?: boolean;
}) {
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    // frontmatter dates are date-only ISO ("2026-08-24") — without this,
    // Date() parses them as UTC midnight and a viewer west of UTC sees
    // the day before.
    timeZone: "UTC",
  });
  const city = metroName(story.city, locale);

  if (featured) {
    return (
      <Link
        href={`/stories/${story.slug}`}
        className="hover-lift edge-light card-crisp group block overflow-hidden rounded-card bg-white"
      >
        <div className="aspect-video w-full overflow-hidden">
          <StoryCover slug={story.slug} className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
        <div className="p-6 sm:p-8">
          {city && (
            <span className="data-label rounded-full bg-olive/[0.06] px-2.5 py-1 text-olive/70">{city}</span>
          )}
          <h2 className="font-display mt-3 text-[28px] leading-tight font-bold text-olive group-hover:text-brass-deep sm:text-[36px]">
            {story.title}
          </h2>
          <p className="mt-2 text-[15px] text-stone sm:text-base">{story.description}</p>
          <p className="data-label mt-4 text-olive/50">
            {dateFormat.format(new Date(story.date))} · {readLabel}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="hover-lift card-crisp group flex flex-col overflow-hidden rounded-card bg-white"
    >
      <div className="aspect-video w-full overflow-hidden">
        <StoryCover slug={story.slug} className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        {city && <span className="data-label text-brass-deep">{city}</span>}
        <h3 className="font-display mt-2 line-clamp-2 text-lg font-bold text-olive group-hover:text-brass-deep">
          {story.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-stone">{story.description}</p>
        <p className="data-label mt-4 text-olive/45">
          {dateFormat.format(new Date(story.date))} · {readLabel}
        </p>
      </div>
    </Link>
  );
}
