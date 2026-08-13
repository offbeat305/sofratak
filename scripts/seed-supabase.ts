/**
 * Seed the Supabase project with the Beit Zizo demo restaurant.
 * Prereq: supabase/migrations/0001_init.sql applied (SQL editor).
 * Run:    npx tsx scripts/seed-supabase.ts
 * Idempotent — upserts by id, safe to re-run.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { beitZizo as r, beitZizoMenu as menu } from "../src/lib/db/seed/beit-zizo";

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
  process.exit(1);
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  const res = await fetch(`${URL}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: KEY!,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    console.error(`✗ ${table}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`✓ ${table}: ${rows.length} rows`);
}

async function main() {
await upsert("restaurants", [
  {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    logo_url: r.logoUrl,
    cover_url: r.coverUrl,
    brand: r.brand,
    halal: r.halal,
    phone: r.phone,
    address: r.address,
    timezone: r.timezone,
    hours: r.hours,
    instagram_url: r.instagramUrl,
    google_reviews_url: r.googleReviewsUrl,
    ordering: r.ordering,
  },
]);

await upsert(
  "menu_categories",
  menu.categories.map((c) => ({
    id: c.id,
    restaurant_id: r.id,
    name: c.name,
    sort: c.sort,
  })),
);

await upsert(
  "modifier_groups",
  menu.modifierGroups.map((g) => ({
    id: g.id,
    restaurant_id: r.id,
    name: g.name,
    min: g.min,
    max: g.max,
    options: g.options,
  })),
);

await upsert(
  "menu_items",
  menu.items.map((i) => ({
    id: i.id,
    restaurant_id: r.id,
    category_id: i.categoryId,
    name: i.name,
    description: i.description,
    price_cents: i.priceCents,
    image_url: i.imageUrl,
    sold_out: i.soldOut,
    modifier_group_ids: i.modifierGroupIds,
    sort: i.sort,
  })),
);

console.log("Seed complete — Beit Zizo Shawarma is live in Supabase.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
