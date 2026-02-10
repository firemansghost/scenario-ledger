import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getMostRecentFriday } from "@/lib/dates";
import { getDailyValue } from "@/lib/overrides";
import { runAllIndicators } from "@/lib/indicators";
import { computeScoring } from "@/lib/scoring";
import { computeAlignment } from "@/lib/alignment";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

export interface WeeklyPipelineResult {
  week_ending: string;
  active_scenario: ScenarioKey;
  confidence: string;
  data_completeness: number;
}

export async function runWeeklyPipeline(weekEnding?: string): Promise<WeeklyPipelineResult> {
  const supabase = createServiceRoleClient();
  const we = weekEnding ?? getMostRecentFriday();

  const { data: forecastRow } = await supabase
    .from("forecasts")
    .select("id, config")
    .eq("is_active", true)
    .single();
  if (!forecastRow) throw new Error("No active forecast");

  const btc_close = await getDailyValue(supabase, "btc_usd", we);
  const spy_close = await getDailyValue(supabase, "spy", we);
  const indicatorOutputs = await runAllIndicators(supabase, we);

  for (const row of indicatorOutputs) {
    await supabase.from("indicator_weekly").upsert(
      {
        week_ending: we,
        indicator_key: row.indicator_key,
        value: row.value,
        delta: row.delta,
        state: row.state,
        details: row.details ?? {},
      },
      { onConflict: "week_ending,indicator_key" }
    );
  }

  const indicatorRows = indicatorOutputs.map((r) => ({
    indicator_key: r.indicator_key,
    state: r.state as "bullish" | "neutral" | "bearish",
  }));
  const defs = await supabase.from("indicator_definitions").select("key, weights");
  const definitions: Record<string, { weights: Record<string, Partial<Record<ScenarioKey, number>>> }> = {};
  for (const d of defs.data ?? []) {
    definitions[d.key] = { weights: d.weights as Record<string, Partial<Record<ScenarioKey, number>>> };
  }
  const data_completeness = indicatorOutputs.filter((r) => r.value != null).length / 6;
  const vixStress = indicatorOutputs.find((r) => r.indicator_key === "vix_regime")?.state === "bearish";
  const config = forecastRow.config as ForecastConfig;
  const scoringResult = computeScoring({
    indicatorRows,
    definitions,
    dataCompleteness: data_completeness,
    vixStress,
    scoring: config.scoring,
  });

  const { alignment, spx_factor, spx_equiv } = computeAlignment({
    config,
    weekEnding: we,
    btcClose: btc_close ?? null,
    spyClose: spy_close ?? null,
  });

  await supabase.from("weekly_snapshots").upsert(
    {
      week_ending: we,
      forecast_id: forecastRow.id,
      btc_close: btc_close ?? null,
      spy_close: spy_close ?? null,
      spx_equiv: spx_equiv ?? null,
      spx_factor,
      scenario_scores: scoringResult.scenario_scores,
      scenario_probs: scoringResult.scenario_probs,
      active_scenario: scoringResult.active_scenario,
      confidence: scoringResult.confidence,
      alignment,
      top_contributors: scoringResult.top_contributors,
      data_completeness,
    },
    { onConflict: "week_ending" }
  );

  return {
    week_ending: we,
    active_scenario: scoringResult.active_scenario,
    confidence: scoringResult.confidence,
    data_completeness,
  };
}
