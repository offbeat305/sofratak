import type { MenuImportProvider, ParsedMenu, ParsedMenuCategory } from "./types";

// "Grilled Chicken Plate .... 12.99" / "Hummus - $6" / "Fattoush 8.50"
const PRICE_LINE = /^(.+?)\s*[.\-–—]{0,4}\s*\$?\s*(\d{1,4}(?:\.\d{2})?)\s*$/;

/**
 * No AI involved: a line ending in a price becomes an item under the most
 * recent heading; any other short line becomes a new heading. Good enough
 * for menus pasted from a PDF/website/Word doc — admin reviews and edits
 * the parse before committing, so false positives are cheap to fix.
 */
export class TextHeuristicMenuImportProvider implements MenuImportProvider {
  readonly kind = "text";

  async parse({ text }: { text: string }): Promise<ParsedMenu> {
    const categories: ParsedMenuCategory[] = [];
    const skippedLines: string[] = [];
    let current: ParsedMenuCategory | null = null;

    for (const raw of text.split("\n")) {
      const line = raw.trim();
      if (!line) continue;

      const priceMatch = line.match(PRICE_LINE);
      if (priceMatch) {
        const name = priceMatch[1].replace(/[.\-–—\s]+$/, "").trim();
        const price = Number(priceMatch[2]);
        if (name.length >= 2 && Number.isFinite(price) && price > 0 && price < 500) {
          if (!current) {
            current = { name: "Menu", items: [] };
            categories.push(current);
          }
          current.items.push({ name, price });
          continue;
        }
      }

      if (line.length <= 40) {
        current = { name: line.replace(/:$/, ""), items: [] };
        categories.push(current);
        continue;
      }

      skippedLines.push(line);
    }

    return { categories: categories.filter((c) => c.items.length > 0), skippedLines };
  }
}

export function getMenuImportProvider(): MenuImportProvider {
  return new TextHeuristicMenuImportProvider();
}
