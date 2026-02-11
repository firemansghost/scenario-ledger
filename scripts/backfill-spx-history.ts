/**
 * Backfill S&P 500 Index (SPX) daily history from Stooq into daily_series.
 * Uses ^spx ticker by default; chunks by ~2 years. Longer history than SPY when available.
 *
 * Usage: npm run backfill:spx-history
 * Override ticker: STOOQ_SPX_TICKER=^gspc npm run backfill:spx-history
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import "./_env";
import { createClient } from "@supabase/supabase-js";
import { fetchStooqDateRangeForTicker } from "../lib/sources/stooq";

const TICKERS_TO_TRY = [
  process.env.STOOQ_SPX_TICKER ?? "^spx",
  "^gspc",
];
const SERIES_KEY = "spx";
const START_DATE = "1990-01-01";
const CHUNK_YEARS = 2;

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

async function main() {
  const supabase = createSupabase();

  console.log("SPX history backfill: from", START_DATE, "to", toYYYYMMDD(new Date()));
  console.log("Tickers to try:", TICKERS_TO_TRY.join(", "));

  let totalInserted = 0;

  for (const ticker of TICKERS_TO_TRY) {
    console.log("\nTrying ticker:", ticker);
    totalInserted = 0;
    const end = new Date();
    const start = new Date(START_DATE);

    while (start < end) {
      const chunkEnd = new Date(start);
      chunkEnd.setFullYear(chunkEnd.getFullYear() + CHUNK_YEARS);
      if (chunkEnd > end) chunkEnd.setTime(end.getTime());
      const d1 = toYYYYMMDD(start);
      const d2 = toYYYYMMDD(chunkEnd);
      try {
        const rows = await fetchStooqDateRangeForTicker(ticker, SERIES_KEY, d1, d2, 3000);
        for (const p of rows) {
          await supabase.from("daily_series").upsert(
            { series_key: p.series_key, source: p.source, dt: p.dt, value: p.value },
            { onConflict: "series_key,source,dt" }
          );
          totalInserted++;
        }
        console.log("  ", d1, "..", d2, "→", rows.length, "rows");
      } catch (e) {
        console.error("  Chunk", d1, "..", d2, "failed:", e instanceof Error ? e.message : e);
      }
      start.setTime(chunkEnd.getTime());
    }

    if (totalInserted > 0) {
      console.log("\nTicker", ticker, "succeeded. Total rows upserted:", totalInserted);
      break;
    }
    console.warn("\nTicker", ticker, "returned 0 rows. Trying fallback...");
  }

  if (totalInserted === 0) {
    console.error("\nAll tickers returned 0 rows. Ticker likely wrong. Check Stooq symbol for S&P 500.");
  }

  console.log("\nDone. Total rows upserted:", totalInserted);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
