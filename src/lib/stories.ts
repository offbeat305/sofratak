import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { marked } from "marked";
import { EAT_METROS } from "@/content/eat-metros";
import { composeListingView } from "@/lib/eat/compose";
import { getStore } from "@/lib/db/store";

/**
 * /stories — the marketing site's editorial section (docs decision:
 * "stories", not "blog" — brand voice). Articles are markdown files in
 * content/stories/ with simple frontmatter; EN-first per the Arabic
 * review rule. Photos in articles must be ours/licensed — same
 * no-scraping rule as the directory. Generated (non-photo) covers per
 * design-pass-6 keep that rule unbreakable even for the index/OG art.
 */

export type StoryTopic = "guide" | "spotlight";

export type StoryTocItem = { id: string; text: string };

export type Story = {
  slug: string;
  title: string;
  description: string;
  /** ISO date */
  date: string;
  /** metro slug, matches content/eat-metros.ts — omit for site-wide pieces */
  city: string | null;
  topic: StoryTopic;
  readMinutes: number;
  toc: StoryTocItem[];
  /** rendered HTML (from our own markdown files — trusted content) */
  html: string;
};

const STORIES_DIR = path.join(process.cwd(), "content", "stories");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z]+):\s*(.+)$/);
    if (kv) meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: match[2] };
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/** Adds scroll-anchor ids to every h2 and collects them for the TOC sidebar. */
function extractToc(html: string): { html: string; toc: StoryTocItem[] } {
  const toc: StoryTocItem[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_full, inner: string) => {
    const text = decodeEntities(inner.replace(/<[^>]+>/g, ""));
    let id = slugifyHeading(text) || "section";
    let n = 2;
    while (used.has(id)) id = `${id}-${n++}`;
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

/** GFM-style "> [!TIP] ..." blockquotes become a .story-callout box. */
function extractCallouts(html: string): string {
  return html.replace(
    /<blockquote>\s*<p>\[!(TIP|NOTE)\]\s*([\s\S]*?)<\/p>([\s\S]*?)<\/blockquote>/g,
    (_full, kind: string, firstLine: string, rest: string) => {
      const label = kind === "TIP" ? "Tip" : "Note";
      const restBody = rest.trim();
      return (
        `<div class="story-callout not-prose">` +
        `<div><strong>${label}</strong><p>${firstLine}</p>${restBody}</div>` +
        `</div>`
      );
    },
  );
}

const HALAL_LABEL: Record<string, string> = {
  verified: "Halal verified",
  reported: "Reported halal",
  unknown: "",
};

const ARCH_AVATAR = `<svg viewBox="0 0 96 96" class="absolute inset-0 h-full w-full text-olive/[0.14]" preserveAspectRatio="xMidYMax slice"><path d="M8 96 V56 a40 40 0 0 1 80 0 V96" fill="none" stroke="currentColor" stroke-width="3"/><path d="M28 96 V64 a20 20 0 0 1 40 0 V96" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`;

async function renderRestaurantMention(citySlug: string, listingSlug: string, locale: string): Promise<string> {
  const metro = EAT_METROS.find((m) => m.slug === citySlug);
  if (!metro) return "";
  const listing = await getStore().getDirectoryListing(citySlug, listingSlug);
  if (!listing || !listing.published) return "";
  const view = await composeListingView(listing, metro);
  const initial = (view.name.trim()[0] ?? "•").toUpperCase();
  const cuisines = view.cuisines.map((c) => c[0].toUpperCase() + c.slice(1)).join(" · ");
  const halal = HALAL_LABEL[view.halalStatus] || "";
  const meta = [cuisines, halal].filter(Boolean).join(" · ");
  const href = `/${locale}/eat/${citySlug}/${listingSlug}`;
  const ctaHref = view.verified && view.orderPath ? `/${locale}${view.orderPath}` : href;
  const ctaLabel = view.verified && view.orderPath ? "Order Now" : "View listing";

  return (
    `<a href="${ctaHref}" class="story-mention-card not-prose">` +
    `<span class="story-mention-avatar">${ARCH_AVATAR}<span>${initial}</span></span>` +
    `<span class="story-mention-body"><span class="story-mention-name">${view.name}</span>` +
    `<span class="story-mention-meta">${meta}</span></span>` +
    `<span class="story-mention-cta">${ctaLabel}</span>` +
    `</a>`
  );
}

/** "{{restaurant:city/slug}}" on its own line becomes a live directory card. */
async function expandRestaurantMentions(html: string, locale: string): Promise<string> {
  const pattern = /<p>\{\{restaurant:([a-z0-9-]+)\/([a-z0-9-]+)\}\}<\/p>/g;
  const matches = [...html.matchAll(pattern)];
  if (matches.length === 0) return html;
  const cards = await Promise.all(matches.map((m) => renderRestaurantMention(m[1], m[2], locale)));
  let i = 0;
  return html.replace(pattern, () => cards[i++] ?? "");
}

function wordCount(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  return (text.match(/\S+/g) ?? []).length;
}

async function loadStory(filename: string, locale: string): Promise<Story | null> {
  const slug = filename.replace(/\.md$/, "");
  try {
    const raw = await fs.readFile(path.join(STORIES_DIR, filename), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.title || !meta.date) return null;
    let html = await marked.parse(body);
    html = extractCallouts(html);
    const { html: withIds, toc } = extractToc(html);
    html = await expandRestaurantMentions(withIds, locale);
    return {
      slug,
      title: meta.title,
      description: meta.description ?? "",
      date: meta.date,
      city: meta.city ?? null,
      topic: meta.topic === "spotlight" ? "spotlight" : "guide",
      readMinutes: Math.max(1, Math.round(wordCount(html) / 200)),
      toc,
      html,
    };
  } catch {
    return null;
  }
}

export async function listStories(locale: string = "en"): Promise<Story[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(STORIES_DIR)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const stories = (await Promise.all(files.map((f) => loadStory(f, locale)))).filter(
    (s): s is Story => s !== null,
  );
  return stories.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getStory(slug: string, locale: string = "en"): Promise<Story | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return loadStory(`${slug}.md`, locale);
}
