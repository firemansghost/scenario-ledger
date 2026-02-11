/**
 * Backfill BTC daily history from CoinGecko into daily_series (series_key=btc_usd, source=coingecko).
 * Chunks by year to reduce payload and avoid rate limits.
 *
 * Usage: npm run backfill:btc-history
 */
import "./_env";
import { createClient } from "@supabase/supabase-js";

const SERIES_KEY = "btc_usd";
const SOURCE = "coingecko";
const START_YEAR = 2013;
const CHUNK_DAYS = 400;

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

interface DailyPoint {
  series_key: string;
  source: string;
  dt: string;
  value: number;
}

async function fetchBtcChunk(fromTs: number, toTs: number): Promise<DailyPoint[]> {
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${fromTs}&to=${toTs}`;
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
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dt, value]) => ({
      series_key: SERIES_KEY,
      source: SOURCE,
      dt,
      value: Math.round(value * 100) / 100,
    }));
}

async function main() {
  const supabase = createSupabase();
  const now = Date.now();
  let totalInserted = 0;
  const startTs = new Date(`${START_YEAR}-01-01`).getTime() / 1000;

  console.log("BTC history backfill: from", START_YEAR, "to today");

  let from = startTs;
  while (from < now / 1000) {
    const to = Math.min(from + CHUNK_DAYS * 86400, now / 1000);
    try {
      const rows = await fetchBtcChunk(Math.floor(from), Math.floor(to));
      for (const p of rows) {
        await supabase.from("daily_series").upsert(
          { series_key: p.series_key, source: p.source, dt: p.dt, value: p.value },
          { onConflict: "series_key,source,dt" }
        );
        totalInserted++;
      }
      const d1 = new Date(from * 1000).toISOString().slice(0, 10);
      const d2 = new Date(to * 1000).toISOString().slice(0, 10);
      console.log("  ", d1, "..", d2, "→", rows.length, "rows");
    } catch (e) {
      console.error("  Chunk failed:", e instanceof Error ? e.message : e);
    }
    from = to;
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log("Done. Total rows upserted:", totalInserted);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
