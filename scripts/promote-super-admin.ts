/**
 * Grant super-admin access to an existing Sofratak login (/admin panel).
 * Run: npx tsx scripts/promote-super-admin.ts <email>
 *
 * Sets app_metadata.role = "super_admin", which both the Postgres
 * is_super_admin() function (RLS) and lib/auth/server.ts's getSuperAdmin()
 * check — app_metadata is only writable via the service-role key, so a
 * signed-in user can never grant this to themselves.
 *
 * Uses Supabase's REST APIs directly (supabase-js realtime needs Node 22+).
 */
import { readFileSync } from "fs";
import { join } from "path";

const [email] = process.argv.slice(2);
if (!email) {
  console.error("Usage: npx tsx scripts/promote-super-admin.ts <email>");
  process.exit(1);
}

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const URL = env.SUPABASE_URL!;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY!;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function main() {
  let match: { id: string; app_metadata?: Record<string, unknown> } | undefined;
  for (let page = 1; page <= 10 && !match; page++) {
    const listRes = await fetch(`${URL}/auth/v1/admin/users?page=${page}&per_page=100`, {
      headers: HEADERS,
    });
    const list = await listRes.json();
    const users: Array<{ id: string; email?: string; app_metadata?: Record<string, unknown> }> =
      list.users ?? [];
    match = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!users.length) break;
  }
  if (!match) {
    console.error(`No user found with email ${email}. Create their login first (scripts/create-owner.ts).`);
    process.exit(1);
  }

  const updateRes = await fetch(`${URL}/auth/v1/admin/users/${match.id}`, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify({
      app_metadata: { ...match.app_metadata, role: "super_admin" },
    }),
  });
  if (!updateRes.ok) {
    console.error(`Update failed: ${await updateRes.text()}`);
    process.exit(1);
  }

  console.log(`✓ ${email} is now a Sofratak super admin — /admin is open to them.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
