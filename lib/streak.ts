/**
 * Weekly streak and consistency meter logic.
 * Client-only (localStorage). No notifications.
 */

const KEY_SEEN_WEEKS = "scenarioledger_seen_weeks";
const KEY_LAST_CHECKIN = "scenarioledger_last_checkin_week";
const KEY_LONGEST_STREAK = "scenarioledger_longest_streak";

export type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  checkedLast8: number;
  lastCheckinWeek?: string;
};

function parseISODate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid ISO date: ${dateStr}`);
  return d;
}

function diffDays(a: string, b: string): number {
  const da = parseISODate(a);
  const db = parseISODate(b);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((da.getTime() - db.getTime()) / msPerDay);
}

/** b is ~7 days earlier than a (6–8 day tolerance) */
function isConsecutiveWeek(a: string, b: string): boolean {
  const d = diffDays(a, b);
  return d >= 6 && d <= 8;
}

/** Generate the last 8 week endings before latest (each -7 days). */
function getLast8WeekEndings(latestWeek: string): string[] {
  const weeks: string[] = [];
  let current = latestWeek;
  for (let i = 0; i < 8; i++) {
    weeks.push(current);
    const d = parseISODate(current);
    d.setDate(d.getDate() - 7);
    current = d.toISOString().slice(0, 10);
  }
  return weeks;
}

export function loadSeenWeeks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_SEEN_WEEKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed)].filter((w) => typeof w === "string" && /^\d{4}-\d{2}-\d{2}$/.test(w));
  } catch {
    return [];
  }
}

export function saveSeenWeeks(weeks: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique = [...new Set(weeks)].sort().reverse();
    localStorage.setItem(KEY_SEEN_WEEKS, JSON.stringify(unique));
  } catch {
    // ignore
  }
}

export function computeStreakStats(
  seenWeeks: string[],
  latestWeek?: string
): StreakStats {
  const sorted = [...new Set(seenWeeks)].sort().reverse();
  const lastCheckinWeek = sorted[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;

  for (let i = 0; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    if (i === 0 || (prev && isConsecutiveWeek(prev, sorted[i]))) {
      run++;
      if (i === 0) currentStreak = run;
    } else {
      run = 1;
      if (i > 0) currentStreak = 0;
    }
    if (run > longestStreak) longestStreak = run;
  }

  let checkedLast8 = 0;
  const anchor = latestWeek ?? lastCheckinWeek;
  if (anchor) {
    const last8 = getLast8WeekEndings(anchor);
    const seenSet = new Set(seenWeeks);
    checkedLast8 = last8.filter((w) => seenSet.has(w)).length;
  }

  return {
    currentStreak,
    longestStreak,
    checkedLast8,
    lastCheckinWeek: lastCheckinWeek ?? undefined,
  };
}

export function markWeekSeen(weekEnding: string): { weeks: string[]; stats: StreakStats } {
  const weeks = loadSeenWeeks();
  if (!weeks.includes(weekEnding)) {
    weeks.push(weekEnding);
    weeks.sort().reverse();
    saveSeenWeeks(weeks);
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY_LAST_CHECKIN, weekEnding);
  }
  const stats = computeStreakStats(weeks, weekEnding);
  if (typeof window !== "undefined" && stats.longestStreak > 0) {
    const stored = parseInt(localStorage.getItem(KEY_LONGEST_STREAK) ?? "0", 10);
    if (stats.longestStreak > stored) {
      localStorage.setItem(KEY_LONGEST_STREAK, String(stats.longestStreak));
    }
  }
  return { weeks, stats };
}

/** Check if a week is in the seen list (client-only). */
export function isWeekSeen(weekEnding: string): boolean {
  return loadSeenWeeks().includes(weekEnding);
}
