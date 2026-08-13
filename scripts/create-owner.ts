/**
 * Create an owner/staff login for a restaurant.
 * Run: npx tsx scripts/create-owner.ts <email> <restaurant-slug> [owner|staff]
 * Prints a generated temporary password ONCE — store it in a password
 * manager and change it after first login.
 *
 * Uses Supabase's REST APIs directly (supabase-js realtime needs Node 22+).
 */
import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

const [email, slug, role = "owner"] = process.argv.slice(2);
if (!email || !slug || !["owner", "staff"].includes(role)) {
  console.error("Usage: npx tsx scripts/create-owner.ts <email> <slug> [owner|staff]");
  process.exit(1);
}

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const URL = env.SUPABASE_URL!;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function main() {
  // restaurant lookup
  const restRes = await fetch(
    `${URL}/rest/v1/restaurants?slug=eq.${slug}&select=id`,
    { headers: HEADERS },
  );
  const restaurants = (await restRes.json()) as Array<{ id: string }>;
  if (!restaurants.length) {
    console.error(`Restaurant "${slug}" not found`);
    process.exit(1);
  }
  const restaurantId = restaurants[0].id;

  // create user (or find existing)
  const password = randomBytes(9).toString("base64url");
  let userId: string | null = null;
  let createdNew = false;

  const createRes = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const created = await createRes.json();
  if (createRes.ok) {
    userId = created.id;
    createdNew = true;
  } else {
    // probably exists — search the admin user list
    for (let page = 1; page <= 10 && !userId; page++) {
      const listRes = await fetch(
        `${URL}/auth/v1/admin/users?page=${page}&per_page=100`,
        { headers: HEADERS },
      );
      const list = await listRes.json();
      const users: Array<{ id: string; email?: string }> = list.users ?? [];
      const match = users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (match) userId = match.id;
      if (!users.length) break;
    }
    if (!userId) {
      console.error(`Could not create user: ${JSON.stringify(created)}`);
      process.exit(1);
    }
    console.log("User already exists — adding membership only.");
  }

  // membership
  const memberRes = await fetch(
    `${URL}/rest/v1/restaurant_members?on_conflict=restaurant_id,user_id`,
    {
      method: "POST",
      headers: { ...HEADERS, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        user_id: userId,
        role,
      }),
    },
  );
  if (!memberRes.ok) {
    console.error(`Membership failed: ${await memberRes.text()}`);
    process.exit(1);
  }

  if (createdNew) {
    // sanity check: the fresh credentials actually sign in
    const loginRes = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: ANON,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    console.log(`Created user ${email} (login check: ${loginRes.ok ? "OK" : "FAILED"})`);
    console.log(`TEMPORARY PASSWORD (shown once): ${password}`);
  }
  console.log(`✓ ${email} is now ${role} of ${slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
