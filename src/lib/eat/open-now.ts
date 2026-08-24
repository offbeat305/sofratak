import type { DayHours } from "@/lib/db/types";

/**
 * "Open now" for directory listings. null hours = unknown (most
 * unclaimed seeds) — callers show no open/closed chip at all rather
 * than guessing (same honesty rule as halal labels).
 * Overnight ranges (close < open, e.g. 18:00–02:00) count the
 * after-midnight stretch as the previous day's service.
 */
export function isOpenNow(hours: DayHours[] | null, timezone: string, at = new Date()): boolean | null {
  if (!hours || hours.length === 0) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const DAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = DAY_INDEX[get("weekday")];
  const now = `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;

  const openAt = (d: number, from: string, to: string) => {
    if (to > from) return d === day && now >= from && now < to;
    // overnight: today's late window OR yesterday's spillover
    return (d === day && now >= from) || ((d + 1) % 7 === day && now < to);
  };

  return hours.some((h) => openAt(h.day, h.open, h.close));
}
