/**
 * Definition-of-done captures for docs/design-pass-3-homepage-glow.md:
 * our homepage vs linear.app and vs owner.com, composed side-by-side.
 * Run: node scripts/design-pass-3-shot.mjs
 */
import { chromium } from "playwright";
import { mkdtempSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const browser = await chromium.launch({ channel: "chrome", headless: false });
const dir = mkdtempSync(join(tmpdir(), "dp3-"));

async function shoot(url, out, wait = 6000) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out });
  await page.close();
  return out;
}

const ours = await shoot("http://localhost:3000/en", join(dir, "ours.png"));
console.log("ours captured");
const linear = await shoot("https://linear.app", join(dir, "linear.png"));
console.log("linear captured");
const owner = await shoot("https://www.owner.com", join(dir, "owner.png"));
console.log("owner captured");

const b64 = (p) => readFileSync(p).toString("base64");
async function compose(rightPath, rightLabel, outFile) {
  const html = `<!doctype html><body style="margin:0;background:#101010;font-family:sans-serif">
<div style="display:flex;gap:8px;padding:8px">
  <figure style="margin:0;flex:1">
    <figcaption style="color:#f7f2e8;padding:6px 2px;font-size:15px;font-weight:700">sofratak.com</figcaption>
    <img src="data:image/png;base64,${b64(ours)}" style="width:100%;display:block"/>
  </figure>
  <figure style="margin:0;flex:1">
    <figcaption style="color:#f7f2e8;padding:6px 2px;font-size:15px;font-weight:700">${rightLabel}</figcaption>
    <img src="data:image/png;base64,${b64(rightPath)}" style="width:100%;display:block"/>
  </figure>
</div></body>`;
  const shell = join(dir, "compose.html");
  writeFileSync(shell, html);
  const page = await browser.newPage({ viewport: { width: 2200, height: 100 } });
  await page.goto("file://" + shell);
  await page.waitForTimeout(400);
  await page.screenshot({ path: outFile, fullPage: true });
  await page.close();
  console.log("wrote", outFile);
}

await compose(linear, "linear.app", "docs/design-pass-3-vs-linear.png");
await compose(owner, "owner.com", "docs/design-pass-3-vs-owner.png");
await browser.close();
