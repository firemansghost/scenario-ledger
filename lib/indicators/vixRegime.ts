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

const STRESS_LEVEL = 25;
const CALM_LEVEL = 15;
const DELTA_UP = 3;
const DELTA_DOWN = -3;

export async function computeVixRegime(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<IndicatorResult> {
  const current = await getWeeklyClose(supabase, "vix", weekEnding);
  const prev = await getWeeklyClose(supabase, "vix", previousWeekEnding(weekEnding));

  if (current == null) {
    return { value: null, delta: null, state: "neutral", details: { missing: true } };
  }

  const delta = prev != null ? current - prev : null;
  let state: IndicatorState = "neutral";
  if (current >= STRESS_LEVEL || (delta != null && delta >= DELTA_UP)) {
    state = "bearish";
  } else if (current <= CALM_LEVEL || (delta != null && delta <= DELTA_DOWN)) {
    state = "bullish";
  }
  return { value: current, delta, state, details: { prev, stressLevel: STRESS_LEVEL, calmLevel: CALM_LEVEL } };
}
