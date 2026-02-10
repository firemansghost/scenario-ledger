import { addDays, format, parseISO, startOfWeek, subDays, subWeeks } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "America/Chicago";

/**
 * Today's date in America/Chicago (YYYY-MM-DD). Use as target for daily ingest.
 */
export function getTodayChicago(date: Date = new Date()): string {
  const inChicago = toZonedTime(date, TZ);
  return format(inChicago, "yyyy-MM-dd");
}

/**
 * Most recent Friday on or before the given date (week-ending). For weekly cron:
 * use this so we always compute the last completed week, not a future Friday.
 */
export function getMostRecentFriday(date: Date = new Date()): string {
  const inChicago = toZonedTime(date, TZ);
  const day = inChicago.getDay(); // 0 Sun .. 5 Fri, 6 Sat
  const daysBack = day === 5 ? 0 : day === 6 ? 1 : (day + 2) % 7;
  const friday = subDays(inChicago, daysBack);
  return format(friday, "yyyy-MM-dd");
}

/**
 * Week ending = Friday in America/Chicago.
 * Returns the Friday date (as YYYY-MM-DD) for the week containing the given date.
 * Mon–Fri: that week's Friday; Sat–Sun: previous Friday.
 * MVP: uses Friday only; holiday handling (last trading day of week) can be added later.
 */
export function getWeekEnding(date: Date = new Date()): string {
  const inChicago = toZonedTime(date, TZ);
  const monday = startOfWeek(inChicago, { weekStartsOn: 1 });
  const friday = addDays(monday, 4);
  return format(friday, "yyyy-MM-dd");
}

/**
 * Parse a YYYY-MM-DD string in America/Chicago (date only, no time).
 */
export function parseWeekEnding(weekEnding: string): Date {
  return parseISO(weekEnding);
}

/**
 * Previous week ending (Friday) before the given week_ending string.
 */
export function previousWeekEnding(weekEnding: string): string {
  const d = parseISO(weekEnding);
  const prev = subWeeks(d, 1);
  return format(prev, "yyyy-MM-dd");
}

/**
 * Start of week (Monday) in Chicago for a given week_ending (Friday) string.
 */
export function startOfWeekForEnding(weekEnding: string): Date {
  const friday = parseISO(weekEnding);
  return startOfWeek(friday, { weekStartsOn: 1 });
}
