/**
 * Definition-of-done capture for docs/design-pass-4-grader.md:
 * our /grader vs grader.zay-os.com, composed side-by-side.
 * Run: node scripts/design-pass-4-shot.mjs
 */
import { chromium } from "playwright";
import { mkdtempSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const browser = await chromium.launch({ channel: "chrome", headless: false });
const dir = mkdtempSync(join(tmpdir(), "dp4-"));

async function shoot(url, out, wait = 6000) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out });
  await page.close();
  return out;
}

const ours = await shoot("http://localhost:3000/en/grader", join(dir, "ours.png"));
console.log("ours captured");
const theirs = await shoot("https://grader.zay-os.com", join(dir, "zayos.png"), 8000);
console.log("zay-os captured");

const b64 = (p) => readFileSync(p).toString("base64");
const html = `<!doctype html><body style="margin:0;background:#101010;font-family:sans-serif">
<div style="display:flex;gap:8px;padding:8px">
  <figure style="margin:0;flex:1">
    <figcaption style="color:#f7f2e8;padding:6px 2px;font-size:15px;font-weight:700">sofratak.com/grader</figcaption>
    <img src="data:image/png;base64,${b64(ours)}" style="width:100%;display:block"/>
  </figure>
  <figure style="margin:0;flex:1">
    <figcaption style="color:#f7f2e8;padding:6px 2px;font-size:15px;font-weight:700">grader.zay-os.com</figcaption>
    <img src="data:image/png;base64,${b64(theirs)}" style="width:100%;display:block"/>
  </figure>
</div></body>`;
const shell = join(dir, "compose.html");
writeFileSync(shell, html);
const page = await browser.newPage({ viewport: { width: 2200, height: 100 } });
await page.goto("file://" + shell);
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/design-pass-4-vs-zayos.png", fullPage: true });
await browser.close();
console.log("wrote docs/design-pass-4-vs-zayos.png");
