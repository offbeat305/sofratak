/**
 * One-time backfill: resolve google_place_id for directory listings that
 * don't have one, via Places API (New) Text Search with an ID-ONLY field
 * mask — the "Text Search (IDs Only)" SKU, which is free, and place IDs
 * are the one piece of Places data Google's ToS explicitly allows
 * storing indefinitely. No other Places content is stored.
 *
 * Run: npx tsx scripts/backfill-place-ids.ts
 * Idempotent — skips rows that already have a place ID.
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
const PLACES_KEY = env.GOOGLE_PLACES_API_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const METRO_HINT: Record<string, string> = {
  tampa: "Tampa Bay, FL",
  dearborn: "Dearborn / Detroit, MI",
  miami: "South Florida",
};

async function findPlaceId(query: string): Promise<string | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY!,
      "X-Goog-FieldMask": "places.id", // IDs-only SKU — free, storable
    },
    body: JSON.stringify({ textQuery: query, regionCode: "US", maxResultCount: 1 }),
  });
  if (!res.ok) {
    console.error(`  places error ${res.status}: ${(await res.text()).slice(0, 120)}`);
    return null;
  }
  const data = (await res.json()) as { places?: Array<{ id: string }> };
  return data.places?.[0]?.id ?? null;
}

async function main() {
  if (!PLACES_KEY) {
    console.error("GOOGLE_PLACES_API_KEY missing");
    process.exit(1);
  }

  const res = await fetch(
    `${BASE}/rest/v1/directory_listings?google_place_id=is.null&select=id,city,name,address&order=city`,
    { headers: H },
  );
  const rows = (await res.json()) as Array<{ id: string; city: string; name: string; address: string }>;
  console.log(`${rows.length} listings without a place ID\n`);

  let found = 0;
  let missed = 0;
  for (const row of rows) {
    const query = [row.name, row.address || METRO_HINT[row.city]].filter(Boolean).join(", ");
    const placeId = await findPlaceId(query);
    if (placeId) {
      const upd = await fetch(`${BASE}/rest/v1/directory_listings?id=eq.${row.id}`, {
        method: "PATCH",
        headers: H,
        body: JSON.stringify({ google_place_id: placeId }),
      });
      if (upd.ok) {
        found++;
        console.log(`✓ ${row.name}`);
      } else {
        missed++;
        console.error(`✗ update failed for ${row.name}`);
      }
    } else {
      missed++;
      console.log(`○ no match: ${row.name} (${query.slice(0, 60)})`);
    }
    await new Promise((r) => setTimeout(r, 120)); // gentle pacing
  }

  console.log(`\nDone: ${found} matched, ${missed} unmatched.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
