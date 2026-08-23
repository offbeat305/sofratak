/**
 * TCPA rules for marketing SMS (see docs/phase5-marketing-spec.md §4).
 * The restaurant's own timezone stands in for the diner's local time —
 * diners are local customers of that restaurant, so this is a reasonable
 * proxy without collecting a diner timezone we don't otherwise have.
 */
export function withinSmsQuietHours(timezone: string, at: Date = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(at),
  );
  return hour >= 8 && hour < 21;
}
