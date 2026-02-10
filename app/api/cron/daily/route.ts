import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getTodayChicago } from "@/lib/dates";
import { sanitizeLogMessage } from "@/lib/logSanitize";
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
  const supabase = createServiceRoleClient();
  const startedAt = new Date();

  const { data: runRow, error: runInsertError } = await supabase
    .from("ingest_runs")
    .insert({ job: "daily", status: "running", target_date: target, summary: {} })
    .select("id")
    .single();

  if (runInsertError || !runRow?.id) {
    return NextResponse.json(
      { error: "Failed to create ingest run", details: runInsertError?.message },
      { status: 500 }
    );
  }
  const runId = runRow.id;

  const results: { series_key: string; source: string; status: string; message?: string; dt?: string }[] = [];

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
    const message = sanitizeLogMessage(error ?? (data.length ? `${data.length} row(s)` : "no data"));
    const dt = data.length ? data[0]?.dt : undefined;
    results.push({ series_key: name, source, status, message, dt });
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
    const msg = sanitizeLogMessage(stooqSpy.error);
    results.push({ series_key: "spy", source: "stooq", status: "failure", message: msg });
    await supabase.from("data_fetch_logs").insert({
      run_id: runId,
      job: "daily",
      source: "stooq",
      series_key: "spy",
      status: "failure",
      message: msg,
      meta: { target, fallback: "alphavantage" },
    });
    spy = await runFetcher("spy", "alphavantage", () => fetchAlphaVantageDaily("SPY"));
  } else {
    spy = stooqSpy.data;
    const msg = sanitizeLogMessage(spy.length ? `${spy.length} row(s)` : "no data");
    results.push({ series_key: "spy", source: "stooq", status: "success", message: msg, dt: spy[0]?.dt });
    await supabase.from("data_fetch_logs").insert({
      run_id: runId,
      job: "daily",
      source: "stooq",
      series_key: "spy",
      status: "success",
      message: msg,
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

  const finishedAt = new Date();
  const successCount = results.filter((r) => r.status === "success").length;
  const failureCount = results.filter((r) => r.status === "failure").length;
  let runStatus: "success" | "partial" | "failure" = "success";
  if (failureCount === results.length) runStatus = "failure";
  else if (failureCount > 0) runStatus = "partial";

  const seriesSummary: Record<string, { status: string; source: string; dt?: string }> = {};
  for (const r of results) {
    seriesSummary[r.series_key] = { status: r.status, source: r.source, ...(r.dt && { dt: r.dt }) };
  }

  await supabase
    .from("ingest_runs")
    .update({
      finished_at: finishedAt.toISOString(),
      status: runStatus,
      summary: {
        series: seriesSummary,
        counts: { success: successCount, failure: failureCount },
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
      },
    })
    .eq("id", runId);

  const hasFailures = failureCount > 0;
  return NextResponse.json(
    {
      target,
      run_id: runId,
      status: runStatus,
      results,
      upserted: allPoints.length,
      duration_ms: finishedAt.getTime() - startedAt.getTime(),
    },
    { status: hasFailures ? 503 : 200 }
  );
}
