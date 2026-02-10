import type { SupabaseClient } from "@supabase/supabase-js";

/** One log row from a run (source, series_key, status, message). */
export interface DailyLogRow {
  source: string;
  series_key: string | null;
  status: string;
  message: string | null;
}

/** Summary counts and duration from ingest_runs.summary. */
export interface RunSummaryCounts {
  success?: number;
  failure?: number;
  duration_ms?: number;
}

/** Latest daily run: anchored to ingest_runs row + fetch logs. */
export interface LatestDailyRun {
  id: string;
  runAt: string; // ISO started_at (kept for backward compat)
  started_at: string;
  finished_at: string | null;
  status: string;
  target_date: string | null;
  summary: {
    counts?: RunSummaryCounts;
    series?: Record<string, { status: string; source: string; dt?: string }>;
    duration_ms?: number;
  };
  logs: DailyLogRow[];
}

/** Latest weekly run from ingest_runs (no fetch logs). */
export interface LatestWeeklyRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  week_ending: string | null;
  summary: Record<string, unknown>;
}

/** Latest dt per series_key from daily_series. */
export type LatestSeriesDates = Record<string, string>;

/** Latest weekly snapshot summary (from weekly_snapshots). */
export interface LatestSnapshotInfo {
  week_ending: string;
  created_at: string;
  active_scenario: string;
}

export interface DataHealthPayload {
  dailyRun: LatestDailyRun | null;
  weeklyRun: LatestWeeklyRun | null;
  seriesDates: LatestSeriesDates;
  latestSnapshot: LatestSnapshotInfo | null;
}

const EXPECTED_SERIES = [
  { key: "btc_usd", name: "BTC", sourceLabel: "CoinGecko" },
  { key: "spy", name: "SPY", sourceLabel: "Stooq/AV" },
  { key: "vix", name: "VIX", sourceLabel: "FRED" },
  { key: "dxy", name: "USD proxy (DXY)", sourceLabel: "FRED" },
  { key: "fred_dfii10", name: "10y real yields", sourceLabel: "FRED" },
  { key: "fred_hyoas", name: "HY spreads", sourceLabel: "FRED" },
] as const;

/**
 * Get the latest daily run from ingest_runs, then fetch data_fetch_logs for that run_id.
 */
export async function getLatestDailyRun(
  supabase: SupabaseClient
): Promise<LatestDailyRun | null> {
  const { data: runRow } = await supabase
    .from("ingest_runs")
    .select("id, started_at, finished_at, status, target_date, summary")
    .eq("job", "daily")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!runRow?.id) return null;

  const { data: logs } = await supabase
    .from("data_fetch_logs")
    .select("source, series_key, status, message")
    .eq("run_id", runRow.id)
    .order("series_key");

  const summary = (runRow.summary ?? {}) as LatestDailyRun["summary"];
  const startedAt = runRow.started_at ? new Date(runRow.started_at).toISOString() : "";

  return {
    id: runRow.id,
    runAt: startedAt,
    started_at: startedAt,
    finished_at: runRow.finished_at ? new Date(runRow.finished_at).toISOString() : null,
    status: runRow.status ?? "unknown",
    target_date: runRow.target_date ?? null,
    summary,
    logs: (logs ?? []).map((r) => ({
      source: r.source ?? "",
      series_key: r.series_key ?? null,
      status: r.status ?? "unknown",
      message: r.message ?? null,
    })),
  };
}

/**
 * Get the latest weekly run from ingest_runs.
 */
export async function getLatestWeeklyRun(
  supabase: SupabaseClient
): Promise<LatestWeeklyRun | null> {
  const { data: runRow } = await supabase
    .from("ingest_runs")
    .select("id, started_at, finished_at, status, week_ending, summary")
    .eq("job", "weekly")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!runRow?.id) return null;

  return {
    id: runRow.id,
    started_at: runRow.started_at ? new Date(runRow.started_at).toISOString() : "",
    finished_at: runRow.finished_at ? new Date(runRow.finished_at).toISOString() : null,
    status: runRow.status ?? "unknown",
    week_ending: runRow.week_ending ?? null,
    summary: (runRow.summary as Record<string, unknown>) ?? {},
  };
}

/**
 * For each series_key, get max(dt) from daily_series.
 * Uses one query ordered by dt desc and keeps first (max) dt per series_key.
 */
export async function getLatestSeriesDates(
  supabase: SupabaseClient
): Promise<LatestSeriesDates> {
  const { data } = await supabase
    .from("daily_series")
    .select("series_key, dt")
    .order("dt", { ascending: false });

  const out: LatestSeriesDates = {};
  if (!data) return out;
  for (const row of data) {
    const key = row.series_key;
    const dt = row.dt ?? "";
    if (!key || out[key]) continue;
    out[key] = dt;
  }
  return out;
}

/**
 * Latest weekly snapshot by week_ending (max week_ending).
 */
export async function getLatestSnapshotInfo(
  supabase: SupabaseClient
): Promise<LatestSnapshotInfo | null> {
  const { data } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, created_at, active_scenario")
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    week_ending: String(data.week_ending),
    created_at: data.created_at ? new Date(data.created_at).toISOString() : "",
    active_scenario: data.active_scenario ?? "",
  };
}

/**
 * Build full data health payload for the dashboard.
 * Call with a client that can read ingest_runs, data_fetch_logs, daily_series (e.g. service role).
 */
export async function getDataHealth(
  supabase: SupabaseClient
): Promise<DataHealthPayload> {
  const [dailyRun, weeklyRun, seriesDates, latestSnapshot] = await Promise.all([
    getLatestDailyRun(supabase),
    getLatestWeeklyRun(supabase),
    getLatestSeriesDates(supabase),
    getLatestSnapshotInfo(supabase),
  ]);

  return {
    dailyRun,
    weeklyRun,
    seriesDates,
    latestSnapshot,
  };
}

/** Display labels for expected series (for DataHealthCard). */
export function getExpectedSeriesLabels() {
  return EXPECTED_SERIES;
}
