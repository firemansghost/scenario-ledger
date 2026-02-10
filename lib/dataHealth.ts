import type { SupabaseClient } from "@supabase/supabase-js";

/** One log row from the latest daily run (source, series_key, status, message). */
export interface DailyLogRow {
  source: string;
  series_key: string | null;
  status: string;
  message: string | null;
}

/** Latest daily run: run timestamp and all log rows for that run. */
export interface LatestDailyRun {
  runAt: string; // ISO
  logs: DailyLogRow[];
}

/** Latest dt per series_key from daily_series. */
export type LatestSeriesDates = Record<string, string>;

/** Latest weekly snapshot summary. */
export interface LatestSnapshotInfo {
  week_ending: string;
  created_at: string;
  active_scenario: string;
}

export interface DataHealthPayload {
  dailyRun: LatestDailyRun | null;
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
 * Get the latest daily run: max(created_at) where job='daily', then all logs with that run_id.
 * Uses run_id to group (one run_id per ingest).
 */
export async function getLatestDailyRun(
  supabase: SupabaseClient
): Promise<LatestDailyRun | null> {
  const { data: anchor } = await supabase
    .from("data_fetch_logs")
    .select("run_id, created_at")
    .eq("job", "daily")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!anchor?.run_id) return null;

  const { data: logs } = await supabase
    .from("data_fetch_logs")
    .select("source, series_key, status, message")
    .eq("run_id", anchor.run_id)
    .order("series_key");

  const runAt = anchor.created_at
    ? new Date(anchor.created_at).toISOString()
    : "";

  return {
    runAt,
    logs: (logs ?? []).map((r) => ({
      source: r.source ?? "",
      series_key: r.series_key ?? null,
      status: r.status ?? "unknown",
      message: r.message ?? null,
    })),
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
 * Call with a client that can read data_fetch_logs and daily_series (e.g. service role).
 */
export async function getDataHealth(
  supabase: SupabaseClient
): Promise<DataHealthPayload> {
  const [dailyRun, seriesDates, latestSnapshot] = await Promise.all([
    getLatestDailyRun(supabase),
    getLatestSeriesDates(supabase),
    getLatestSnapshotInfo(supabase),
  ]);

  return {
    dailyRun,
    seriesDates,
    latestSnapshot,
  };
}

/** Display labels for expected series (for DataHealthCard). */
export function getExpectedSeriesLabels() {
  return EXPECTED_SERIES;
}
