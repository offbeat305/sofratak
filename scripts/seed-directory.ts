/**
 * Seed the /eat directory from data/directory-seed.csv (see that file's
 * header comments for the format), plus the Beit Zizo demo restaurant as
 * a claimed/Verified listing.
 *
 * Run: npx tsx scripts/seed-directory.ts
 * Idempotent — upserts on (city, slug). Missing lat/lng are geocoded
 * once via OpenStreetMap Nominatim (free; 1 req/sec per their policy) —
 * we store OSM coordinates, which keeps us entirely clear of Google
 * Places caching restrictions for seed data.
 */
import { readFileSync } from "fs";
import { join } from "path";

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const BASE = env.SUPABASE_URL!;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates",
};

const VALID_CITIES = new Set(["tampa", "dearborn", "miami"]);
const VALID_CUISINES = new Set([
  "lebanese", "palestinian", "yemeni", "iraqi", "egyptian", "syrian", "jordanian", "mediterranean",
]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "SofratakDirectorySeeder/1.0 (contact: offbeat305@gmail.com)" },
  });
  if (!res.ok) return null;
  const results = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

async function upsert(rows: Record<string, unknown>[]) {
  const res = await fetch(`${BASE}/rest/v1/directory_listings?on_conflict=city,slug`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(`✗ upsert failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
}

async function main() {
  // 1 · Beit Zizo — the claimed/Verified demo listing (address from the seed)
  await upsert([
    {
      city: "tampa",
      slug: "beit-zizo-shawarma",
      name: "Beit Zizo Shawarma",
      address: "4212 W Kennedy Blvd, Tampa, FL 33609",
      lat: 27.9445,
      lng: -82.5107,
      phone: "(813) 555-0142",
      cuisines: ["lebanese", "mediterranean"],
      halal_status: "verified", // allowed: this row is claimed
      claimed_restaurant_id: "rest-beitzizo",
      source: "manual",
    },
  ]);
  console.log("✓ Beit Zizo (claimed demo listing)");

  // 2 · CSV rows
  const csv = readFileSync(join(process.cwd(), "data", "directory-seed.csv"), "utf8");
  const lines = csv.split("\n").slice(1).filter((l) => l.trim() && !l.trim().startsWith("#"));
  let seeded = 0;
  let skipped = 0;

  for (const line of lines) {
    const [city, name, slugRaw, address, phone, cuisinesRaw, halalRaw, latRaw, lngRaw] =
      parseCsvLine(line);
    if (!VALID_CITIES.has(city)) { console.warn(`skip (bad city): ${line.slice(0, 60)}`); skipped++; continue; }
    if (!name) { skipped++; continue; }

    const cuisines = (cuisinesRaw ?? "")
      .split("|")
      .map((c) => c.trim().toLowerCase())
      .filter((c) => VALID_CUISINES.has(c));
    // Hard rule: seeds may only ever be 'reported' or 'unknown'.
    const halal_status = halalRaw?.toLowerCase() === "reported" ? "reported" : "unknown";

    let lat = latRaw ? parseFloat(latRaw) : NaN;
    let lng = lngRaw ? parseFloat(lngRaw) : NaN;
    // Only geocode street-level addresses (≥3 comma parts, e.g.
    // "12710 W Warren Ave, Dearborn, MI"). City-only rows would all pin
    // to the same city-centroid point — a wrong pin is worse than none.
    const streetLevel = address && address.split(",").length >= 3;
    if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && streetLevel) {
      const geo = await geocode(address);
      await sleep(1100); // Nominatim policy: max 1 req/sec
      if (geo) { lat = geo.lat; lng = geo.lng; }
      else console.warn(`  ⚠ geocode FAILED for "${name}" (${address})`);
    } else if (!Number.isFinite(lat) && !streetLevel) {
      console.warn(`  ○ no street address for "${name}" — listing without a map pin`);
    }

    await upsert([
      {
        city,
        slug: slugRaw || slugify(name),
        name,
        address: address ?? "",
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        phone: phone || null,
        cuisines,
        halal_status,
        source: "seed",
      },
    ]);
    seeded++;
    console.log(`✓ ${name}`);
  }

  console.log(`\nDone: ${seeded} seeded, ${skipped} skipped, + Beit Zizo verified.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
