import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getTodayChicago } from "@/lib/dates";
import { fetchBtcDaily } from "@/lib/sources/coingecko";
import { fetchStooqSpyLatest } from "@/lib/sources/stooq";
import { fetchAlphaVantageDaily } from "@/lib/sources/alphavantage";
import { fetchFredLatestForSeries } from "@/lib/sources/fred";
import type { DailyDataPoint } from "@/lib/types";

/** Vercel Cron invokes GET; delegate to POST so Admin can still call POST. */
export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? req.headers.get("x-cron-secret") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = getTodayChicago();
  const runId = crypto.randomUUID();
  const supabase = createServiceRoleClient();
  const results: { series_key: string; source: string; status: string; message?: string }[] = [];

  async function runFetcher(
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
    const message = error ?? (data.length ? `${data.length} row(s)` : "no data");
    results.push({ series_key: name, source, status, message });
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

  const btc = await runFetcher("btc_usd", "coingecko", () => fetchBtcDaily(target));
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
    const avSpy = await runFetcher("spy", "alphavantage", () => fetchAlphaVantageDaily("SPY"));
    spy = avSpy;
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
  const vix = await runFetcher("vix", "fred", () => fetchFredLatestForSeries("vix", target));
  const dxy = await runFetcher("dxy", "fred", () => fetchFredLatestForSeries("dxy", target));
  const dfii = await runFetcher("fred_dfii10", "fred", () => fetchFredLatestForSeries("fred_dfii10", target));
  const hyoas = await runFetcher("fred_hyoas", "fred", () => fetchFredLatestForSeries("fred_hyoas", target));

  const allPoints: DailyDataPoint[] = [...btc, ...spy, ...vix, ...dxy, ...dfii, ...hyoas];

  for (const p of allPoints) {
    await supabase.from("daily_series").upsert(
      {
        series_key: p.series_key,
        source: p.source,
        dt: p.dt,
        value: p.value,
      },
      { onConflict: "series_key,source,dt" }
    );
  }

  const hasFailures = results.some((r) => r.status === "failure");
  return NextResponse.json(
    { target, run_id: runId, results, upserted: allPoints.length },
    { status: hasFailures ? 503 : 200 }
  );
}
