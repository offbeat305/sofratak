/** Verification captures for design-pass-4 (scratchpad only). */
import { chromium } from "playwright";

const OUT = process.argv[2] ?? "/tmp";
const browser = await chromium.launch();

async function page(w = 1440, h = 900) {
  return browser.newPage({ viewport: { width: w, height: h } });
}
async function revealScroll(p) {
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(700);
}

// 1. landing (full)
let p = await page();
await p.goto("http://localhost:3000/en/grader", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3500);
await revealScroll(p);
await p.screenshot({ path: `${OUT}/grader-landing.png`, fullPage: true });
console.log("landing done");

// 2. scan + report (real run)
await p.fill("input", "Byblos Cafe Tampa");
await p.waitForSelector("ul button", { timeout: 15000 });
await p.click("ul button");
await p.waitForTimeout(1300);
await p.screenshot({ path: `${OUT}/grader-scan.png` });
console.log("scan done");
await p.waitForSelector("text=/100", { timeout: 60000 });
await p.waitForTimeout(2500);
await revealScroll(p);
await p.screenshot({ path: `${OUT}/grader-report.png`, fullPage: true });
console.log("report done");
await p.close();

// 3. 390px landing + AR landing
p = await page(390, 844);
await p.goto("http://localhost:3000/en/grader", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
await p.screenshot({ path: `${OUT}/grader-390.png` });
await p.close();
p = await page();
await p.goto("http://localhost:3000/ar/grader", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(3000);
await p.screenshot({ path: `${OUT}/grader-ar.png` });
await p.close();
console.log("mobile+ar done");
await browser.close();
