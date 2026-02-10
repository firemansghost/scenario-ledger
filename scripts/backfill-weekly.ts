/**
 * Optional backfill: run weekly pipeline for past week_endings.
 * Usage: tsx scripts/backfill-weekly.ts [week_ending_start] [week_ending_end]
 * If no args, backfills last 4 weeks.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getMostRecentFriday, previousWeekEnding } from "../lib/dates";
import { getDailyValue } from "../lib/overrides";
import { runAllIndicators } from "../lib/indicators";
import { computeScoring } from "../lib/scoring";
import { computeAlignment } from "../lib/alignment";
import type { ForecastConfig, ScenarioKey } from "../lib/types";

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase env vars.");
  return createClient(url, serviceKey);
}

async function runWeekly(supabase: ReturnType<typeof createServiceRoleClient>, weekEnding: string) {
  const { data: forecastRow } = await supabase
    .from("forecasts")
    .select("id, config")
    .eq("is_active", true)
    .single();
  if (!forecastRow) throw new Error("No active forecast");

  const btc_close = await getDailyValue(supabase, "btc_usd", weekEnding);
  const spy_close = await getDailyValue(supabase, "spy", weekEnding);
  const indicatorOutputs = await runAllIndicators(supabase, weekEnding);

  for (const row of indicatorOutputs) {
    await supabase.from("indicator_weekly").upsert(
      {
        week_ending: weekEnding,
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
  const scoringResult = computeScoring({
    indicatorRows,
    definitions,
    dataCompleteness: data_completeness,
    vixStress,
  });

  const config = forecastRow.config as ForecastConfig;
  const { alignment, spx_factor, spx_equiv } = computeAlignment({
    config,
    weekEnding,
    btcClose: btc_close ?? null,
    spyClose: spy_close ?? null,
  });

  await supabase.from("weekly_snapshots").upsert(
    {
      week_ending: weekEnding,
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
  console.log(`  ${weekEnding} -> ${scoringResult.active_scenario}`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error("Missing Supabase env vars.");
  const supabase = createServiceRoleClient();

  let start: string;
  let end: string;
  if (process.argv[2] && process.argv[3]) {
    start = process.argv[2];
    end = process.argv[3];
  } else {
    end = getMostRecentFriday();
    start = end;
    for (let i = 0; i < 3; i++) start = previousWeekEnding(start);
  }

  console.log(`Backfilling weekly snapshots from ${start} to ${end}`);
  let we = end;
  const toRun: string[] = [];
  while (we >= start) {
    toRun.push(we);
    if (we === start) break;
    we = previousWeekEnding(we);
  }
  for (const w of toRun.reverse()) {
    await runWeekly(supabase, w);
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
