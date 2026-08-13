/**
 * Design-pass done-when: side-by-side screenshot of our homepage vs
 * owner.com, attached to the commit (docs/design-pass-comparison.png).
 * Run: npx tsx scripts/capture-comparison.ts   (dev server on :3000)
 */
import { join } from "path";
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const shots: Record<string, string> = {};

  for (const [name, url] of [
    ["ours", "http://localhost:3000/en"],
    ["owner", "https://www.owner.com"],
  ] as const) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    } catch {
      // heavy marketing sites may never go network-idle — proceed anyway
    }
    await page.waitForTimeout(2500);
    const path = join(process.cwd(), "docs", `.cmp-${name}.png`);
    await page.screenshot({ path });
    shots[name] = path;
    await ctx.close();
    console.log("✓", name);
  }
  await browser.close();

  // composite side by side with labels via Pillow
  const { execFileSync } = await import("child_process");
  execFileSync("python3", [
    "-c",
    `
from PIL import Image, ImageDraw
a = Image.open("${shots.ours}"); b = Image.open("${shots.owner}")
gap = 24
canvas = Image.new("RGB", (a.width + b.width + gap, max(a.height, b.height) + 48), "#1F1F1F")
canvas.paste(a, (0, 48)); canvas.paste(b, (a.width + gap, 48))
d = ImageDraw.Draw(canvas)
d.text((12, 14), "sofratak.com (local build)", fill="#F7F2E8")
d.text((a.width + gap + 12, 14), "owner.com", fill="#F7F2E8")
canvas.save("docs/design-pass-comparison.png", optimize=True)
print("composite saved")
`,
  ], { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
