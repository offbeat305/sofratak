"use client";

import { useState } from "react";
import { EAT_METROS } from "@/content/eat-metros";
import type { Story } from "@/lib/stories";
import { StoryCard } from "./story-card";

export type StoryCardItem = { story: Story; readLabel: string };

/**
 * Index grid with city/topic filter chips (design-pass-6 A) — same chip
 * style as /eat. Client-side only: the story list is small (dozens, not
 * thousands), so a full server round-trip per filter isn't worth it.
 */
export function StoriesGrid({
  items,
  locale,
  allLabel,
  guidesLabel,
  spotlightsLabel,
  emptyLabel,
}: {
  items: StoryCardItem[];
  locale: "en" | "ar";
  allLabel: string;
  guidesLabel: string;
  spotlightsLabel: string;
  emptyLabel: string;
}) {
  const [filter, setFilter] = useState<string>("all");

  const cities = EAT_METROS.filter((m) => items.some((i) => i.story.city === m.slug));

  const filtered = items.filter(({ story }) => {
    if (filter === "all") return true;
    if (filter === "guide" || filter === "spotlight") return story.topic === filter;
    return story.city === filter;
  });

  const chipCls = (active: boolean) =>
    `press shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
      active ? "chip-pop border-olive bg-olive text-ivory" : "border-olive/15 bg-white text-charcoal hover:border-olive/30"
    }`;

  return (
    <>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" onClick={() => setFilter("all")} className={chipCls(filter === "all")}>
          {allLabel}
        </button>
        <button type="button" onClick={() => setFilter("guide")} className={chipCls(filter === "guide")}>
          {guidesLabel}
        </button>
        <button type="button" onClick={() => setFilter("spotlight")} className={chipCls(filter === "spotlight")}>
          {spotlightsLabel}
        </button>
        {cities.map((m) => (
          <button
            key={m.slug}
            type="button"
            onClick={() => setFilter(m.slug)}
            className={chipCls(filter === m.slug)}
          >
            {m.name[locale]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-stone">{emptyLabel}</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(({ story, readLabel }) => (
            <StoryCard key={story.slug} story={story} locale={locale} readLabel={readLabel} />
          ))}
        </div>
      )}
    </>
  );
}
