import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRealYieldsDirection } from "./realYieldsDirection";
import { computeDxyDirection } from "./dxyDirection";
import { computeCreditSpreadsDirection } from "./creditSpreadsDirection";
import { computeVixRegime } from "./vixRegime";
import { computeBtcTrendStructure, computeSpyTrendStructure } from "./trendStructure";

export interface IndicatorOutput {
  indicator_key: string;
  value: number | null;
  delta: number | null;
  state: string;
  details?: unknown;
}

const INDICATORS: Array<{
  key: string;
  fn: (supabase: SupabaseClient, weekEnding: string) => Promise<{ value: number | null; delta: number | null; state: string; details?: unknown }>;
}> = [
  { key: "real_yields_direction", fn: computeRealYieldsDirection },
  { key: "dxy_direction", fn: computeDxyDirection },
  { key: "credit_spreads_direction", fn: computeCreditSpreadsDirection },
  { key: "vix_regime", fn: computeVixRegime },
  { key: "btc_trend_structure", fn: computeBtcTrendStructure },
  { key: "spy_trend_structure", fn: computeSpyTrendStructure },
];

export async function runAllIndicators(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<IndicatorOutput[]> {
  const out: IndicatorOutput[] = [];
  for (const { key, fn } of INDICATORS) {
    const result = await fn(supabase, weekEnding);
    out.push({
      indicator_key: key,
      value: result.value,
      delta: result.delta,
      state: result.state,
      details: result.details,
    });
  }
  return out;
}
