import type { DailyDataPoint } from "@/lib/types";
import type { FetcherResult } from "./types";

/** FRED series ID by our internal series_key (for daily_series + indicators). */
export const FRED_SERIES: Record<string, string> = {
  fred_dfii10: "DFII10",
  fred_hyoas: "BAMLH0A0HYM2",
  vix: "VIXCLS",
  dxy: "DTWEXBGS",
};

/**
 * Fetch latest observation on or before endDate. Ignores missing "."
 * Returns the observation's date and numeric value.
 * @throws Error if no valid numeric observation found: "No observation <= ${endDateISO}"
 */
export async function fetchFredLatestOnOrBefore(
  seriesId: string,
  endDateISO: string
): Promise<{ date: string; value: number }> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error("Missing FRED_API_KEY");

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&observation_end=${endDateISO}&sort_order=desc&limit=10&api_key=${apiKey}&file_type=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = (await res.json()) as { observations?: { date: string; value: string }[] };
  const observations = json.observations ?? [];
  for (const obs of observations) {
    if (obs.value === "." || obs.value === undefined) continue;
    const value = parseFloat(obs.value);
    if (Number.isFinite(value))
      return { date: obs.date, value: Math.round(value * 1000) / 1000 };
  }
  throw new Error(`No observation <= ${endDateISO}`);
}

/**
 * Fetch all observations in a date range (for backfill). Returns array of { date, value }.
 */
export async function fetchFredRange(
  seriesId: string,
  startDateISO: string,
  endDateISO: string
): Promise<{ date: string; value: number }[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) throw new Error("Missing FRED_API_KEY");

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&observation_start=${startDateISO}&observation_end=${endDateISO}&sort_order=asc&api_key=${apiKey}&file_type=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = (await res.json()) as { observations?: { date: string; value: string }[] };
  const observations = json.observations ?? [];
  const out: { date: string; value: number }[] = [];
  for (const obs of observations) {
    if (obs.value === "." || obs.value === undefined) continue;
    const value = parseFloat(obs.value);
    if (Number.isFinite(value)) out.push({ date: obs.date, value: Math.round(value * 1000) / 1000 });
  }
  return out;
}

/**
 * Fetch one series by internal key: latest on or before endDate. Stores under returned date.
 */
export async function fetchFredLatestForSeries(
  seriesKey: keyof typeof FRED_SERIES,
  endDateISO: string
): Promise<FetcherResult> {
  const seriesId = FRED_SERIES[seriesKey];
  if (!seriesId) return { data: [], error: "Unknown series" };

  try {
    const { date, value } = await fetchFredLatestOnOrBefore(seriesId, endDateISO);
    return {
      data: [
        {
          series_key: seriesKey,
          source: "fred",
          dt: date,
          value,
        } as DailyDataPoint,
      ],
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: [], error: message };
  }
}

/**
 * @deprecated Use fetchFredLatestForSeries for reliable ingest (latest on or before date).
 * FRED API: observation for exact date only; often fails when data has lag.
 */
export async function fetchFredDaily(seriesKey: keyof typeof FRED_SERIES, dt: string): Promise<FetcherResult> {
  return fetchFredLatestForSeries(seriesKey, dt);
}
