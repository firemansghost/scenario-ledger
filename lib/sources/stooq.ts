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
      return { data: [], error: "No rows" };
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
      return { data: [], error: "No parsed rows" };
    }
    return { data };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: [], error: message };
  }
}
