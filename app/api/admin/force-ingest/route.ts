import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getTodayChicago } from "@/lib/dates";
import { fetchBtcDaily } from "@/lib/sources/coingecko";
import { fetchStooqSpyLatest } from "@/lib/sources/stooq";
import { fetchAlphaVantageDaily } from "@/lib/sources/alphavantage";
import { fetchFredLatestForSeries } from "@/lib/sources/fred";
import type { DailyDataPoint } from "@/lib/types";

function requireAdminSecret(req: Request): boolean {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.headers.get("x-admin-secret") ?? "";
  const expected = process.env.ADMIN_SECRET;
  return Boolean(expected && secret === expected);
}

/**
 * Force-run daily ingest (same as cron/daily; target = today America/Chicago).
 * Requires ADMIN_SECRET when set.
 */
export async function POST(req: Request) {
  if (process.env.ADMIN_SECRET && !requireAdminSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = getTodayChicago();
  const runId = crypto.randomUUID();
  const supabase = createServiceRoleClient();

  async function run(
    name: string,
    source: string,
    fn: () => Promise<{ data: DailyDataPoint[]; error?: string }>
  ) {
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

  return NextResponse.json({
    target,
    run_id: runId,
    results: [
      { series_key: "btc_usd", count: btc.length },
      { series_key: "spy", count: spy.length },
      { series_key: "vix", count: vix.length },
      { series_key: "dxy", count: dxy.length },
      { series_key: "fred_dfii10", count: dfii.length },
      { series_key: "fred_hyoas", count: hyoas.length },
    ],
    upserted: allPoints.length,
  });
}
