import type { DailyDataPoint } from "@/lib/types";
import type { FetcherResult } from "./types";

const TICKERS: Record<string, string> = {
  spy: "spy.us",
  dxy: "dx-y.us",
  vix: "^vix",
};

/**
 * Stooq CSV: symbol and date format vary. spy.us, dx-y.us, ^vix.
 * URL pattern: https://stooq.com/q/d/l/?s=spy.us&d1=YYYYMMDD&d2=YYYYMMDD&i=d
 */
export async function fetchStooqDaily(
  seriesKey: "spy" | "dxy" | "vix",
  dt: string
): Promise<FetcherResult> {
  const ticker = TICKERS[seriesKey];
  if (!ticker) return { data: [], error: "Unknown series" };

  try {
    const d = dt.replace(/-/g, "");
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(ticker)}&d1=${d}&d2=${d}&i=d`;
    const res = await fetch(url);
    if (!res.ok) {
      return { data: [], error: `HTTP ${res.status}` };
    }
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      return { data: [], error: "No rows (market closed or delayed)." };
    }
    const header = lines[0].toLowerCase();
    const dateIdx = header.includes("date") ? header.split(",").indexOf("date") : 0;
    const closeIdx = header.includes("close") ? header.split(",").indexOf("close") : 4;
    const data: DailyDataPoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      const dateVal = parts[dateIdx]?.trim();
      const closeVal = parts[closeIdx]?.trim();
      if (!dateVal || closeVal === undefined) continue;
      let parsedDate = dateVal;
      if (dateVal.includes("/")) {
        const [m, d, y] = dateVal.split("/");
        parsedDate = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
      }
      const value = parseFloat(closeVal);
      if (!Number.isFinite(value)) continue;
      data.push({
        series_key: seriesKey,
        source: "stooq",
        dt: parsedDate,
        value: Math.round(value * 100) / 100,
      });
    }
    if (data.length === 0) {
      return { data: [], error: "No rows (market closed or delayed)." };
    }
    return { data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: [], error: message };
  }
}

const STOOQ_SPY_TICKER = "spy.us";

function parseStooqCsv(text: string): DailyDataPoint[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const dateIdx = header.includes("date") ? header.split(",").indexOf("date") : 0;
  const closeIdx = header.includes("close") ? header.split(",").indexOf("close") : 4;
  const data: DailyDataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const dateVal = parts[dateIdx]?.trim();
    const closeVal = parts[closeIdx]?.trim();
    if (!dateVal || closeVal === undefined) continue;
    let parsedDate = dateVal;
    if (dateVal.includes("/")) {
      const [m, d, y] = dateVal.split("/");
      parsedDate = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    }
    const value = parseFloat(closeVal);
    if (!Number.isFinite(value)) continue;
    data.push({
      series_key: "spy",
      source: "stooq",
      dt: parsedDate,
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

/**
 * Fetch SPY latest close from Stooq (CSV). Uses spy.us ticker.
 * For daily ingest: returns most recent trading day in the CSV.
 */
export async function fetchStooqSpyLatest(): Promise<FetcherResult> {
  try {
    const url = `https://stooq.com/q/d/l/?s=${STOOQ_SPY_TICKER}&i=d`;
    const res = await fetch(url);
    if (!res.ok) return { data: [], error: `HTTP ${res.status}` };
    const text = await res.text();
    const rows = parseStooqCsv(text);
    if (rows.length === 0) return { data: [], error: "No rows (market closed or delayed)." };
    const sorted = rows.sort((a, b) => b.dt.localeCompare(a.dt));
    return { data: [sorted[0]!] };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: [], error: message };
  }
}

/**
 * Fetch SPY daily closes from Stooq for a date range. Returns last maxTradingRows rows.
 * For backfill: use calendarDaysBack ~90, maxTradingRows ~70.
 */
export async function fetchStooqSpyRange(
  calendarDaysBack: number,
  maxTradingRows: number
): Promise<DailyDataPoint[]> {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - calendarDaysBack);
  const d1 = start.toISOString().slice(0, 10).replace(/-/g, "");
  const d2 = end.toISOString().slice(0, 10).replace(/-/g, "");
  return fetchStooqSpyDateRange(d1, d2, maxTradingRows);
}

/**
 * Fetch SPY daily closes from Stooq for an exact date range (YYYYMMDD).
 * For history backfill: chunk by 2–5 years to avoid giant responses.
 */
export async function fetchStooqSpyDateRange(
  d1YYYYMMDD: string,
  d2YYYYMMDD: string,
  maxRows = 5000
): Promise<DailyDataPoint[]> {
  return fetchStooqDateRangeForTicker(STOOQ_SPY_TICKER, "spy", d1YYYYMMDD, d2YYYYMMDD, maxRows);
}

/**
 * Parse Stooq CSV into daily points with the given series_key.
 */
function parseStooqCsvWithKey(text: string, seriesKey: string): DailyDataPoint[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase();
  const dateIdx = header.includes("date") ? header.split(",").indexOf("date") : 0;
  const closeIdx = header.includes("close") ? header.split(",").indexOf("close") : 4;
  const data: DailyDataPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const dateVal = parts[dateIdx]?.trim();
    const closeVal = parts[closeIdx]?.trim();
    if (!dateVal || closeVal === undefined) continue;
    let parsedDate = dateVal;
    if (dateVal.includes("/")) {
      const [m, d, y] = dateVal.split("/");
      parsedDate = `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    }
    const value = parseFloat(closeVal);
    if (!Number.isFinite(value)) continue;
    data.push({
      series_key: seriesKey,
      source: "stooq",
      dt: parsedDate,
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

/**
 * Fetch daily closes from Stooq for any ticker and date range (YYYYMMDD).
 * Ticker is URL-encoded (e.g. ^gspc for S&P 500). Used for SPX history backfill.
 */
export async function fetchStooqDateRangeForTicker(
  ticker: string,
  seriesKey: string,
  d1YYYYMMDD: string,
  d2YYYYMMDD: string,
  maxRows = 5000
): Promise<DailyDataPoint[]> {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(ticker)}&d1=${d1YYYYMMDD}&d2=${d2YYYYMMDD}&i=d`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseStooqCsvWithKey(text, seriesKey);
  if (rows.length === 0) {
    console.warn(`stooq: 0 rows for ${ticker} ${d1YYYYMMDD}..${d2YYYYMMDD} (url: ${url})`);
    return [];
  }
  const sorted = rows.sort((a, b) => a.dt.localeCompare(b.dt));
  return sorted.slice(-maxRows);
}
