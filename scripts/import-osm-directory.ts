/**
 * Bulk OSM import for the /eat directory (comprehensive-coverage layer).
 *
 * Queries the Overpass API per metro for restaurants/fast food/cafes
 * matching Arab/Middle Eastern cuisine tags, halal diet tags, or
 * obviously-Arab names, then imports them as source='osm' rows.
 *
 * OSM data is ODbL-licensed and legally storable — the /eat UI carries
 * the required "© OpenStreetMap contributors" attribution. OSM halal
 * tags (diet:halal=yes|only) map to 'reported', never 'verified'.
 *
 * Dedupe, conservative on purpose:
 *   1. by osm_id (re-runs are no-ops for already-imported elements)
 *   2. by normalized-name match against EXISTING listings in the same
 *      metro (exact or containment) — curated seeds win over OSM rows
 *
 * Run:  npx tsx scripts/import-osm-directory.ts            (imports)
 *       npx tsx scripts/import-osm-directory.ts --dry-run  (report only)
 * Requires migration 0011 (source 'osm' + osm_id) unless --dry-run.
 */
import { readFileSync } from "fs";
import { join } from "path";

const DRY_RUN = process.argv.includes("--dry-run");

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const BASE = env.SUPABASE_URL!;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

// bbox: south, west, north, east
const METRO_BBOXES: Record<string, string> = {
  tampa: "27.55,-82.90,28.35,-82.10",
  dearborn: "42.15,-83.45,42.55,-82.90",
  miami: "25.45,-80.60,26.95,-79.95",
};

const CUISINE_RE =
  "lebanese|arab|middle_eastern|syrian|iraqi|yemeni|egyptian|jordanian|palestinian|falafel|shawarma|kebab";
const NAME_RE = "shawarma|shawerma|falafel|halal|beirut|damascus|petra|aleppo|yemen";

const CUISINE_MAP: Record<string, string> = {
  lebanese: "lebanese",
  palestinian: "palestinian",
  yemeni: "yemeni",
  iraqi: "iraqi",
  egyptian: "egyptian",
  syrian: "syrian",
  jordanian: "jordanian",
  arab: "mediterranean",
  middle_eastern: "mediterranean",
  mediterranean: "mediterranean",
  falafel: "mediterranean",
  shawarma: "mediterranean",
  kebab: "mediterranean",
};

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const STOP_WORDS = new Set([
  "restaurant", "grill", "grille", "cafe", "kitchen", "cuisine", "the", "and",
  "house", "market", "bakery", "deli", "eatery", "food", "foods", "of", "by",
]);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(" ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return (a.length >= 5 && b.includes(a)) || (b.length >= 5 && a.includes(b));
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function addressFrom(tags: Record<string, string>): string {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.join(", ");
}

function cuisinesFrom(tags: Record<string, string>): string[] {
  const raw = (tags.cuisine ?? "").toLowerCase().split(/[;,]/);
  const mapped = new Set<string>();
  for (const token of raw) {
    const key = CUISINE_MAP[token.trim()];
    if (key) mapped.add(key);
  }
  return [...mapped];
}

async function overpass(city: string): Promise<OsmElement[]> {
  const bbox = METRO_BBOXES[city];
  const query = `
[out:json][timeout:90];
(
  nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["cuisine"~"${CUISINE_RE}",i](${bbox});
  nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["diet:halal"~"^(yes|only)$"](${bbox});
  nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"~"${NAME_RE}",i](${bbox});
);
out center tags;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "SofratakDirectoryImporter/1.0 (contact: offbeat305@gmail.com)",
    },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`Overpass ${city} failed: ${res.status} ${await res.text()}`);
  return ((await res.json()).elements ?? []) as OsmElement[];
}

async function fetchExisting(city: string) {
  // osm_id only exists after migration 0011 — fall back gracefully so
  // --dry-run works beforehand.
  for (const select of ["name,slug,osm_id", "name,slug"]) {
    const res = await fetch(
      `${BASE}/rest/v1/directory_listings?city=eq.${city}&select=${select}`,
      { headers: H },
    );
    const body = await res.json();
    if (Array.isArray(body)) {
      return body as Array<{ name: string; slug: string; osm_id?: string | null }>;
    }
  }
  throw new Error(`could not read existing listings for ${city}`);
}

async function insertRows(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const res = await fetch(`${BASE}/rest/v1/directory_listings?on_conflict=city,slug`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=ignore-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`insert failed: ${res.status} ${await res.text()}`);
}

async function main() {
  console.log(DRY_RUN ? "— DRY RUN (no writes) —\n" : "— IMPORT —\n");
  let totalNew = 0;

  for (const city of Object.keys(METRO_BBOXES)) {
    const elements = await overpass(city);
    const existing = await fetchExisting(city);
    const existingOsmIds = new Set(existing.map((e) => e.osm_id).filter(Boolean));
    const existingNames = existing.map((e) => normalizeName(e.name));
    const existingSlugs = new Set(existing.map((e) => e.slug));

    const rows: Record<string, unknown>[] = [];
    const skippedDupes: string[] = [];
    const seenThisRun = new Set<string>();

    for (const el of elements) {
      const tags = el.tags ?? {};
      const name = tags.name?.trim();
      if (!name) continue;
      if (/coming soon/i.test(name)) continue; // OSM junk entries
      const osmId = `${el.type}/${el.id}`;
      if (existingOsmIds.has(osmId)) continue;

      const normalized = normalizeName(name);
      if (!normalized || seenThisRun.has(normalized)) continue;
      if (existingNames.some((e) => namesMatch(e, normalized))) {
        skippedDupes.push(name);
        continue;
      }
      seenThisRun.add(normalized);

      const lat = el.lat ?? el.center?.lat ?? null;
      const lng = el.lon ?? el.center?.lon ?? null;
      let slug = slugify(name);
      if (existingSlugs.has(slug)) slug = `${slug}-${el.id}`.slice(0, 60);
      existingSlugs.add(slug);

      rows.push({
        city,
        slug,
        name,
        address: addressFrom(tags),
        lat,
        lng,
        phone: tags.phone ?? tags["contact:phone"] ?? null,
        cuisines: cuisinesFrom(tags),
        // OSM halal tags are third-party data → 'reported', never 'verified'
        halal_status: /^(yes|only)$/.test(tags["diet:halal"] ?? "") ? "reported" : "unknown",
        osm_id: osmId,
        source: "osm",
      });
    }

    console.log(
      `${city}: ${elements.length} OSM matches → ${rows.length} new, ` +
        `${skippedDupes.length} deduped against existing listings`,
    );
    if (skippedDupes.length) console.log(`  deduped: ${skippedDupes.join(", ")}`);
    if (DRY_RUN) {
      for (const r of rows) console.log(`  + ${r.name} (${r.halal_status}${(r.cuisines as string[]).length ? ", " + (r.cuisines as string[]).join("/") : ""})`);
    } else {
      await insertRows(rows);
    }
    totalNew += rows.length;
    await new Promise((r) => setTimeout(r, 2000)); // be polite to Overpass
  }

  console.log(`\n${DRY_RUN ? "Would import" : "Imported"}: ${totalNew} new listings.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
