/**
 * Definition-of-done capture for docs/design-pass-2.md: our metro page
 * next to yelp.com search results, composed into one PNG committed like
 * last time (docs/design-pass-comparison.png).
 *
 * Run: node scripts/design-pass-2-shot.mjs
 */
import { chromium } from "playwright";
import { mkdtempSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const browser = await chromium.launch({
  headless: false,
  channel: "chrome",
  args: ["--disable-blink-features=AutomationControlled"],
});
const dir = mkdtempSync(join(tmpdir(), "dp2-"));

async function shoot(url, out, { wait = 9000, height = 1000 } = {}) {
  const page = await browser.newPage({
    viewport: { width: 1440, height },
    userAgent: UA,
  });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out });
  await page.close();
  return out;
}

const ours = await shoot("http://localhost:3000/en/eat/miami", join(dir, "ours.png"));
console.log("ours captured");
let yelp = null;
try {
  yelp = await shoot(
    "https://www.yelp.com/search?find_desc=Lebanese&find_loc=Miami%2C+FL",
    join(dir, "yelp.png"),
    { wait: 7000 },
  );
  console.log("yelp captured");
} catch (e) {
  console.error("yelp capture failed:", e.message);
}

// compose side-by-side via an HTML shell
const b64 = (p) => readFileSync(p).toString("base64");
const html = `<!doctype html><body style="margin:0;background:#1f1f1f;font-family:sans-serif">
<div style="display:flex;gap:8px;padding:8px">
  <figure style="margin:0;flex:1">
    <figcaption style="color:#f7f2e8;padding:6px 2px;font-size:15px;font-weight:700">sofratak.com /eat/miami</figcaption>
    <img src="data:image/png;base64,${b64(ours)}" style="width:100%;display:block"/>
  </figure>
  ${
    yelp
      ? `<figure style="margin:0;flex:1">
    <figcaption style="color:#f7f2e8;padding:6px 2px;font-size:15px;font-weight:700">yelp.com search results</figcaption>
    <img src="data:image/png;base64,${b64(yelp)}" style="width:100%;display:block"/>
  </figure>`
      : ""
  }
</div></body>`;
const shell = join(dir, "compose.html");
writeFileSync(shell, html);
const page = await browser.newPage({ viewport: { width: 2200, height: 100 } });
await page.goto("file://" + shell);
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/design-pass-2-comparison.png", fullPage: true });
await browser.close();
console.log("wrote docs/design-pass-2-comparison.png");
