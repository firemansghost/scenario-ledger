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

export async function computeCreditSpreadsDirection(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<IndicatorResult> {
  const current = await getWeeklyClose(supabase, "fred_hyoas", weekEnding);
  const prev = await getWeeklyClose(supabase, "fred_hyoas", previousWeekEnding(weekEnding));

  if (current == null) {
    return { value: null, delta: null, state: "neutral", details: { missing: true } };
  }

  const delta = prev != null ? current - prev : null;
  let state: IndicatorState = "neutral";
  if (delta != null) {
    if (delta > 0.1) state = "bearish";
    else if (delta < -0.1) state = "bullish";
  }
  return { value: current, delta, state, details: { prev } };
}
