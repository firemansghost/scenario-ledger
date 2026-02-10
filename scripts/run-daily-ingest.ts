/**
 * Run daily ingest once (same as cron/daily): fetch today's data for all series, upsert into daily_series, log to data_fetch_logs.
 * Usage: npx tsx scripts/run-daily-ingest.ts
 */
import "./_env";
import { createClient } from "@supabase/supabase-js";
import { getTodayChicago } from "../lib/dates";
import { fetchBtcDaily } from "../lib/sources/coingecko";
import { fetchStooqSpyLatest } from "../lib/sources/stooq";
import { fetchAlphaVantageDaily } from "../lib/sources/alphavantage";
import { fetchFredLatestForSeries } from "../lib/sources/fred";
import type { DailyDataPoint } from "../lib/types";

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

async function main() {
  const supabase = createSupabase();
  const target = getTodayChicago();
  const runId = crypto.randomUUID();

  async function run(
    name: string,
    source: string,
    fn: () => Promise<{ data: DailyDataPoint[]; error?: string }>
  ): Promise<DailyDataPoint[]> {
    let data: DailyDataPoint[] = [];
    let error: string | undefined;
    try {
      const out = await fn();
      data = out.data;
      error = out.error;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    const status = error ? "failure" : "success";
    const message = error ?? `${data.length} row(s)`;
    await supabase.from("data_fetch_logs").insert({
      run_id: runId,
      job: "daily",
      source,
      series_key: name,
      status,
      message,
      meta: { target, count: data.length },
    });
    return data;
  }

  const btc = await run("btc_usd", "coingecko", () => fetchBtcDaily(target));
  let spy: DailyDataPoint[] = [];
  const stooqSpy = await fetchStooqSpyLatest();
  if (stooqSpy.error) {
    await supabase.from("data_fetch_logs").insert({
      run_id: runId,
      job: "daily",
      source: "stooq",
      series_key: "spy",
      status: "failure",
      message: stooqSpy.error,
      meta: { target, fallback: "alphavantage" },
    });
    spy = await run("spy", "alphavantage", () => fetchAlphaVantageDaily("SPY"));
  } else {
    spy = stooqSpy.data;
    await supabase.from("data_fetch_logs").insert({
      run_id: runId,
      job: "daily",
      source: "stooq",
      series_key: "spy",
      status: "success",
      message: spy.length ? `${spy.length} row(s)` : "no data",
      meta: { target, count: spy.length },
    });
  }
  const vix = await run("vix", "fred", () => fetchFredLatestForSeries("vix", target));
  const dxy = await run("dxy", "fred", () => fetchFredLatestForSeries("dxy", target));
  const dfii = await run("fred_dfii10", "fred", () => fetchFredLatestForSeries("fred_dfii10", target));
  const hyoas = await run("fred_hyoas", "fred", () => fetchFredLatestForSeries("fred_hyoas", target));

  const allPoints: DailyDataPoint[] = [...btc, ...spy, ...vix, ...dxy, ...dfii, ...hyoas];
  for (const p of allPoints) {
    await supabase.from("daily_series").upsert(
      { series_key: p.series_key, source: p.source, dt: p.dt, value: p.value },
      { onConflict: "series_key,source,dt" }
    );
  }

  console.log("Daily ingest complete. Target:", target);
  console.log("  btc_usd:", btc.length, "| spy:", spy.length, "| vix:", vix.length, "| dxy:", dxy.length, "| fred_dfii10:", dfii.length, "| fred_hyoas:", hyoas.length);
  console.log("  Total upserted:", allPoints.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
