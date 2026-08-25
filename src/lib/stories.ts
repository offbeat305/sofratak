import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { marked } from "marked";

/**
 * /stories — the marketing site's editorial section (docs decision:
 * "stories", not "blog" — brand voice). Articles are markdown files in
 * content/stories/ with simple frontmatter; EN-first per the Arabic
 * review rule. Photos in articles must be ours/licensed — same
 * no-scraping rule as the directory.
 */

export type Story = {
  slug: string;
  title: string;
  description: string;
  /** ISO date */
  date: string;
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

async function loadStory(filename: string): Promise<Story | null> {
  const slug = filename.replace(/\.md$/, "");
  try {
    const raw = await fs.readFile(path.join(STORIES_DIR, filename), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.title || !meta.date) return null;
    return {
      slug,
      title: meta.title,
      description: meta.description ?? "",
      date: meta.date,
      html: await marked.parse(body),
    };
  } catch {
    return null;
  }
}

export async function listStories(): Promise<Story[]> {
  let files: string[] = [];
  try {
    files = (await fs.readdir(STORIES_DIR)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const stories = (await Promise.all(files.map(loadStory))).filter((s): s is Story => s !== null);
  return stories.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getStory(slug: string): Promise<Story | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return loadStory(`${slug}.md`);
}
