export type ParsedMenuItem = { name: string; price: number };
export type ParsedMenuCategory = { name: string; items: ParsedMenuItem[] };
export type ParsedMenu = { categories: ParsedMenuCategory[]; skippedLines: string[] };

/**
 * Menu import is adapter-shaped on purpose: only a free text-paste
 * heuristic exists today (no paid OCR/vision API key yet). A future
 * photo/PDF provider implements the same interface and slots into
 * getMenuImportProvider() without touching the admin UI or commit flow.
 */
export interface MenuImportProvider {
  readonly kind: string;
  parse(input: { text: string }): Promise<ParsedMenu>;
}
