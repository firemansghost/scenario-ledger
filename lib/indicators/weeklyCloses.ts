import type { SupabaseClient } from "@supabase/supabase-js";
import { previousWeekEnding } from "@/lib/dates";
import { getDailyValue } from "@/lib/overrides";

/**
 * Resolve weekly close for a series on week_ending (Friday). Uses override-aware daily value.
 */
export async function getWeeklyClose(
  supabase: SupabaseClient,
  seriesKey: string,
  weekEnding: string
): Promise<number | null> {
  return getDailyValue(supabase, seriesKey, weekEnding);
}

/**
 * Get last N weekly closes (including weekEnding). Returns array from oldest to newest.
 */
export async function getLastWeeklyCloses(
  supabase: SupabaseClient,
  seriesKey: string,
  weekEnding: string,
  n: number
): Promise<number[]> {
  const out: number[] = [];
  let we = weekEnding;
  for (let i = 0; i < n; i++) {
    const v = await getWeeklyClose(supabase, seriesKey, we);
    if (v != null) out.unshift(v);
    we = previousWeekEnding(we);
  }
  return out;
}
