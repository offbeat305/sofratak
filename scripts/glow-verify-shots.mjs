/** Verification captures for design-pass-3 (scratchpad only, not committed). */
import { chromium } from "playwright";

const OUT = process.argv[2] ?? "/tmp";
const browser = await chromium.launch();

async function shot(url, name, { width = 1440, height = 900, full = false, wait = 3500 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(wait);
  // step-scroll so every Reveal fires before a full-page capture
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await page.close();
  console.log(name, "done");
}

await shot("http://localhost:3000/en", "home-full", { full: true, wait: 6000 });
await shot("http://localhost:3000/en/pricing", "pricing", { wait: 4000 });
await shot("http://localhost:3000/ar", "home-ar", { wait: 5000 });
await shot("http://localhost:3000/en", "home-390", { width: 390, height: 844, wait: 5000 });
await browser.close();
