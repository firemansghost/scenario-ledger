import type { DailyDataPoint } from "@/lib/types";
import type { FetcherResult } from "./types";

const TIME_SERIES_KEY = "Time Series (Daily)";

/**
 * Alpha Vantage TIME_SERIES_DAILY_ADJUSTED: returns most recent trading day close.
 * Symbol is normalized to uppercase. Uses 4. close. Store as series_key: spy, source: alphavantage.
 * Throws exact API message for "Error Message", "Information", or "Note"; otherwise "Unexpected AV response keys: ...".
 */
export async function fetchAlphaVantageDailyAdjusted(symbol: string): Promise<FetcherResult> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return { data: [], error: "Missing ALPHAVANTAGE_API_KEY" };

  const normalized = symbol.toUpperCase();
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(normalized)}&apikey=${apiKey}`;
  const res = await fetch(url);
  const json = (await res.json()) as Record<string, unknown>;

  const errMsg = json["Error Message"];
  if (typeof errMsg === "string") return { data: [], error: errMsg };
  const info = json["Information"];
  if (typeof info === "string") return { data: [], error: info };
  const note = json["Note"];
  if (typeof note === "string") return { data: [], error: note };

  if (!res.ok) return { data: [], error: `HTTP ${res.status}` };

  const series = json[TIME_SERIES_KEY] as Record<string, Record<string, string>> | undefined;
  if (!series || typeof series !== "object") {
    const keys = Object.keys(json).join(", ");
    return { data: [], error: `Unexpected AV response keys: ${keys}` };
  }

  const dates = Object.keys(series).sort((a, b) => b.localeCompare(a));
  const latestDate = dates[0];
  if (!latestDate) return { data: [], error: "No observations" };

  const day = series[latestDate];
  const closeStr = day?.["4. close"];
  if (closeStr == null) return { data: [], error: "No close for latest date" };
  const value = parseFloat(closeStr);
  if (!Number.isFinite(value)) return { data: [], error: "Invalid close value" };

  const dataPoint: DailyDataPoint = {
    series_key: "spy",
    source: "alphavantage",
    dt: latestDate,
    value: Math.round(value * 100) / 100,
  };
  return { data: [dataPoint] };
}

/**
 * Fetch full daily adjusted series (for backfill). Returns up to last N trading days.
 */
export async function fetchAlphaVantageDailyAdjustedRange(
  symbol: string,
  lastNDays: number
): Promise<DailyDataPoint[]> {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) return [];

  const normalized = symbol.toUpperCase();
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(normalized)}&apikey=${apiKey}`;
  const res = await fetch(url);
  const json = (await res.json()) as Record<string, unknown>;

  const errMsg = json["Error Message"];
  if (typeof errMsg === "string") throw new Error(errMsg);
  if (typeof json["Information"] === "string") throw new Error(json["Information"] as string);
  if (typeof json["Note"] === "string") throw new Error(json["Note"] as string);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const series = json[TIME_SERIES_KEY] as Record<string, Record<string, string>> | undefined;
  if (!series || typeof series !== "object") {
    throw new Error(`Unexpected AV response keys: ${Object.keys(json).join(", ")}`);
  }

  const dates = Object.keys(series).sort((a, b) => b.localeCompare(a)).slice(0, lastNDays);
  const out: DailyDataPoint[] = [];
  for (const dt of dates) {
    const closeStr = series[dt]?.["4. close"];
    if (closeStr == null) continue;
    const value = parseFloat(closeStr);
    if (!Number.isFinite(value)) continue;
    out.push({
      series_key: "spy",
      source: "alphavantage",
      dt,
      value: Math.round(value * 100) / 100,
    });
  }
  return out;
}
