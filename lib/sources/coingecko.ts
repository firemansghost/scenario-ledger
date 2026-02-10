import type { DailyDataPoint } from "@/lib/types";
import type { FetcherResult } from "./types";

const SERIES_KEY = "btc_usd";
const SOURCE = "coingecko";

/**
 * Fetch BTC daily close by date from CoinGecko (no API key).
 * Uses market_chart then finds closest to requested date, or coingecko history endpoint.
 */
export async function fetchBtcDaily(dt: string): Promise<FetcherResult> {
  try {
    const date = new Date(dt);
    const end = Math.floor(date.getTime() / 1000);
    const start = end - 86400 * 2;
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${start}&to=${end}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { data: [], error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { prices?: [number, number][] };
    const prices = json.prices ?? [];
    if (prices.length === 0) {
      return { data: [], error: "No data for date" };
    }
    const targetDay = dt;
    const dayStart = new Date(targetDay).getTime();
    const dayEnd = dayStart + 86400 * 1000;
    const inDay = prices.filter(([t]) => t >= dayStart && t < dayEnd);
    const usePrices = inDay.length ? inDay : prices;
    const closest = usePrices[usePrices.length - 1];
    const value = closest[1];
    const dataPoint: DailyDataPoint = {
      series_key: SERIES_KEY,
      source: SOURCE,
      dt,
      value: Math.round(value * 100) / 100,
    };
    return { data: [dataPoint] };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: [], error: message };
  }
}

/**
 * Fetch BTC daily closes for the last N days (for backfill). Uses market_chart/range, buckets by day.
 */
export async function fetchBtcDailyRange(lastNDays: number): Promise<DailyDataPoint[]> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - lastNDays * 86400;
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${start}&to=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { prices?: [number, number][] };
  const prices = json.prices ?? [];
  const byDay = new Map<string, number>();
  for (const [ts, value] of prices) {
    const d = new Date(ts);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    byDay.set(key, value);
  }
  const sorted = Array.from(byDay.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, lastNDays);
  return sorted.map(([dt, value]) => ({
    series_key: SERIES_KEY,
    source: SOURCE,
    dt,
    value: Math.round(value * 100) / 100,
  }));
}
