/**
 * Business decision (Zizo, Aug 2026): prices display as "$9.49" in BOTH
 * English and Arabic UI. Fixed en-US formatting also keeps server/client
 * ICU output identical (no hydration mismatches).
 */
export function formatCents(cents: number, _locale?: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
