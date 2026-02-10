import type { SupabaseClient } from "@supabase/supabase-js";
import { getWeeklyClose } from "./weeklyCloses";
import { previousWeekEnding } from "@/lib/dates";
import type { IndicatorState } from "@/lib/types";

export interface IndicatorResult {
  value: number | null;
  delta: number | null;
  state: IndicatorState;
  details?: unknown;
}

export async function computeDxyDirection(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<IndicatorResult> {
  const current = await getWeeklyClose(supabase, "dxy", weekEnding);
  const prev = await getWeeklyClose(supabase, "dxy", previousWeekEnding(weekEnding));

  if (current == null) {
    return { value: null, delta: null, state: "neutral", details: { missing: true } };
  }

  let delta: number | null = null;
  if (prev != null && prev !== 0) {
    delta = ((current - prev) / prev) * 100;
  }
  let state: IndicatorState = "neutral";
  if (delta != null) {
    if (delta > 0.5) state = "bearish";
    else if (delta < -0.5) state = "bullish";
  }
  return { value: current, delta, state, details: { prev } };
}
