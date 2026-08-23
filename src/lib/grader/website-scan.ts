import "server-only";
import type { WebsiteScan } from "./types";

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 500_000;

/**
 * Detected from links found IN the restaurant's own site — we have no
 * way to check whether they're listed on a marketplace independently of
 * that, so absence here means "not detected," never "not present."
 */
const ORDERING_PLATFORMS: Array<{ key: string; pattern: RegExp }> = [
  { key: "sofratak", pattern: /sofratak\.com/i },
  { key: "toast", pattern: /toasttab\.com/i },
  { key: "square", pattern: /squareup\.com|square\.site/i },
  { key: "chownow", pattern: /chownow\.com/i },
  { key: "olo", pattern: /\bolo\.com/i },
  { key: "owner.com", pattern: /\bowner\.com/i },
  { key: "clover", pattern: /clover\.com/i },
  { key: "spoton", pattern: /spoton\.com/i },
  { key: "slice", pattern: /slicelife\.com/i },
  { key: "bentobox", pattern: /getbento\.com/i },
  { key: "gloriafood", pattern: /gloriafood\.com/i },
  { key: "otter", pattern: /tryotter\.com|ordermark\.com/i },
];

const MARKETPLACES: Array<{ key: string; pattern: RegExp }> = [
  { key: "doordash", pattern: /doordash\.com/i },
  { key: "ubereats", pattern: /ubereats\.com/i },
  { key: "grubhub", pattern: /grubhub\.com/i },
  { key: "postmates", pattern: /postmates\.com/i },
];

function extractLinks(html: string): string[] {
  const links: string[] = [];
  const re = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) links.push(match[1]);
  return links;
}

const EMPTY: WebsiteScan = {
  checked: false,
  https: false,
  mobileFriendly: false,
  orderingPlatform: null,
  marketplaceLinks: [],
  fetchError: false,
};

export async function scanWebsite(url: string): Promise<WebsiteScan> {
  let target: string;
  try {
    target = new URL(url).toString();
  } catch {
    return EMPTY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SofratakGrader/1.0; +https://www.sofratak.com)" },
    });
    if (!res.ok || !res.body) return { ...EMPTY, checked: true, fetchError: true };

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
      }
    }
    reader.cancel().catch(() => {});
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");

    const links = extractLinks(html);
    const orderingPlatform =
      ORDERING_PLATFORMS.find((p) => links.some((l) => p.pattern.test(l)))?.key ?? null;
    const marketplaceLinks = MARKETPLACES.filter((m) => links.some((l) => m.pattern.test(l))).map(
      (m) => m.key,
    );

    return {
      checked: true,
      https: res.url.startsWith("https://"),
      mobileFriendly: /<meta[^>]+name=["']viewport["']/i.test(html),
      orderingPlatform,
      marketplaceLinks,
      fetchError: false,
    };
  } catch (err) {
    console.error("[grader] website scan failed", err);
    return { ...EMPTY, checked: true, fetchError: true };
  } finally {
    clearTimeout(timeout);
  }
}
