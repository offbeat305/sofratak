/**
 * Latin digits in both locales: matches the brand's money style in Arabic UI
 * and keeps Node/browser ICU output identical (avoids hydration mismatches).
 */
export function formatCents(cents: number, locale: string): string {
  const numberLocale = locale === "ar" ? "ar-u-nu-latn" : locale;
  return new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
