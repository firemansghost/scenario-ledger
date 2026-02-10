import type { SupabaseClient } from "@supabase/supabase-js";
import { getLastWeeklyCloses } from "./weeklyCloses";
import type { IndicatorState } from "@/lib/types";

export interface IndicatorResult {
  value: number | null;
  delta: number | null;
  state: IndicatorState;
  details?: unknown;
}

const LOOKBACK = 8;

/**
 * Classify last N weekly closes: higher-highs (bullish), lower-lows (bearish), range (neutral).
 */
function classifyTrend(closes: number[]): IndicatorState {
  if (closes.length < 2) return "neutral";
  const highs = closes;
  const lows = closes;
  let higherHighs = true;
  let lowerLows = true;
  for (let i = 1; i < highs.length; i++) {
    if (highs[i]! <= highs[i - 1]!) higherHighs = false;
    if (lows[i]! >= lows[i - 1]!) lowerLows = false;
  }
  if (higherHighs) return "bullish";
  if (lowerLows) return "bearish";
  return "neutral";
}

export async function computeBtcTrendStructure(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<IndicatorResult> {
  const closes = await getLastWeeklyCloses(supabase, "btc_usd", weekEnding, LOOKBACK);
  if (closes.length === 0) {
    return { value: null, delta: null, state: "neutral", details: { missing: true } };
  }
  const value = closes[closes.length - 1]!;
  const prev = closes.length >= 2 ? closes[closes.length - 2]! : null;
  const delta = prev != null ? value - prev : null;
  const state = classifyTrend(closes);
  return { value, delta, state, details: { closes, lookback: LOOKBACK } };
}

export async function computeSpyTrendStructure(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<IndicatorResult> {
  const closes = await getLastWeeklyCloses(supabase, "spy", weekEnding, LOOKBACK);
  if (closes.length === 0) {
    return { value: null, delta: null, state: "neutral", details: { missing: true } };
  }
  const value = closes[closes.length - 1]!;
  const prev = closes.length >= 2 ? closes[closes.length - 2]! : null;
  const delta = prev != null ? value - prev : null;
  const state = classifyTrend(closes);
  return { value, delta, state, details: { closes, lookback: LOOKBACK } };
}
