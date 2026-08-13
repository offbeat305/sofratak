/**
 * Capture real app screenshots for the homepage product tour
 * (design-pass §5: "real screenshots in phone/tablet frames").
 *
 * Run: OWNER_EMAIL=… OWNER_PASSWORD=… npx tsx scripts/capture-tour.ts
 * Needs the dev server on :3000. Seeds two temporary kitchen orders,
 * captures, then deletes them.
 */
import { readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { chromium } from "playwright";

const env: Record<string, string> = {};
for (const line of readFileSync(join(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=\s*(.+?)\s*$/);
  if (m) env[m[1]] = m[2];
}
const URL_ = env.SUPABASE_URL!;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const EMAIL = process.env.OWNER_EMAIL!;
const PASSWORD = process.env.OWNER_PASSWORD!;
const APP = "http://localhost:3000";
const OUT = join(process.cwd(), "public", "tour");

const SERVICE_HEADERS = {
  apikey: SERVICE,
  Authorization: `Bearer ${SERVICE}`,
  "Content-Type": "application/json",
};

const TEMP_IDS = ["scr-temp-1", "scr-temp-2"];

function tempOrder(id: string, number: string, status: string, minsAgo: number) {
  const created = new Date(Date.now() - minsAgo * 60_000).toISOString();
  return {
    id,
    restaurant_id: "rest-beitzizo",
    number,
    status,
    fulfillment: "pickup",
    scheduled_for: null,
    customer: { name: "Sara H.", phone: "(813) 555-0100", smsOptIn: false },
    delivery_address: null,
    lines: [
      {
        menuItemId: "itm-mixed-shawarma-plate",
        name: { en: "Mixed Shawarma Plate", ar: "صحن شاورما مشكل" },
        qty: 2,
        unitPriceCents: 1699,
        modifiers: [
          { groupName: { en: "Choose your side", ar: "اختر الطبق الجانبي" }, optionName: { en: "Rice with vermicelli", ar: "رز بالشعيرية" }, priceDeltaCents: 0 },
          { groupName: { en: "Spice level", ar: "مستوى الحار" }, optionName: { en: "Hot", ar: "حار" }, priceDeltaCents: 0 },
        ],
        notes: null,
        lineTotalCents: 3398,
      },
      {
        menuItemId: "itm-mint-lemonade",
        name: { en: "Fresh Mint Lemonade", ar: "ليموناضة بالنعناع" },
        qty: 2,
        unitPriceCents: 449,
        modifiers: [],
        notes: null,
        lineTotalCents: 898,
      },
    ],
    subtotal_cents: 4296,
    service_fee_cents: 79,
    delivery_fee_cents: 0,
    tip_cents: 645,
    total_cents: 5020,
    payment_status: "paid",
    payment_ref: "screenshot_fixture",
    refunds: [],
    locale: "en",
    created_at: created,
    updated_at: created,
  };
}

async function seedOrders() {
  const res = await fetch(`${URL_}/rest/v1/orders`, {
    method: "POST",
    headers: { ...SERVICE_HEADERS, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([
      tempOrder("scr-temp-1", "A214", "received", 2),
      tempOrder("scr-temp-2", "K180", "preparing", 11),
    ]),
  });
  if (!res.ok) throw new Error(`seed failed: ${await res.text()}`);
}

async function cleanupOrders() {
  await fetch(`${URL_}/rest/v1/orders?id=in.(${TEMP_IDS.join(",")})`, {
    method: "DELETE",
    headers: SERVICE_HEADERS,
  });
}

async function authCookie(): Promise<{ name: string; value: string }> {
  const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`auth failed: ${await res.text()}`);
  const session = await res.json();
  const ref = new URL(URL_).hostname.split(".")[0];
  return {
    name: `sb-${ref}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url"),
  };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  await seedOrders();
  const cookie = await authCookie();
  const browser = await chromium.launch();

  try {
    // storefront — phone
    for (const [locale, file] of [
      ["en", "storefront-en.png"],
      ["ar", "storefront-ar.png"],
    ] as const) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 780 },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      await page.goto(`${APP}/${locale}/s/beitzizo`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(OUT, file) });
      await ctx.close();
      console.log("✓", file);
    }

    // kitchen + dashboard — tablet, authenticated
    for (const [path, file] of [
      ["/en/kitchen/beitzizo", "kitchen.png"],
      ["/en/dashboard/beitzizo", "dashboard.png"],
    ] as const) {
      const ctx = await browser.newContext({
        viewport: { width: 1024, height: 720 },
        deviceScaleFactor: 2,
      });
      await ctx.addCookies([
        { ...cookie, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
      ]);
      const page = await ctx.newPage();
      await page.goto(`${APP}${path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      if (page.url().includes("/login")) {
        throw new Error(`auth cookie rejected for ${path} — landed on ${page.url()}`);
      }
      await page.screenshot({ path: join(OUT, file) });
      await ctx.close();
      console.log("✓", file);
    }
  } finally {
    await browser.close();
    await cleanupOrders();
    console.log("temp orders cleaned up");
  }
}

main().catch(async (err) => {
  console.error(err);
  await cleanupOrders();
  process.exit(1);
});
