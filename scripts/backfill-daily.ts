/**
 * Backfill daily_series for the last N trading days so weekly pipeline has data.
 * Run once after deploy to make charts populate immediately.
 *
 * Usage: npm run backfill:daily
 *
 * - SPY: Alpha Vantage TIME_SERIES_DAILY_ADJUSTED, insert last 60 trading days
 * - BTC: CoinGecko market_chart/range, derive daily closes, insert last 60 days
 * - FRED (fred_dfii10, fred_hyoas, vix, dxy): observations for last 90 days
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { subDays } from "date-fns";
import { fetchBtcDailyRange } from "../lib/sources/coingecko";
import { fetchAlphaVantageDailyAdjustedRange } from "../lib/sources/alphavantage";
import { fetchFredRange, FRED_SERIES } from "../lib/sources/fred";

const SPY_DAYS = 60;
const BTC_DAYS = 60;
const FRED_DAYS = 90;

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

function formatISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const supabase = createSupabase();
  const today = formatISO(new Date());
  const fredStart = formatISO(subDays(new Date(), FRED_DAYS));

  console.log("Backfilling daily_series...");
  console.log("  SPY: last", SPY_DAYS, "trading days (Alpha Vantage)");
  let count = 0;

  try {
    const spyPoints = await fetchAlphaVantageDailyAdjustedRange("SPY", SPY_DAYS);
    for (const p of spyPoints) {
      await supabase.from("daily_series").upsert(
        { series_key: p.series_key, source: p.source, dt: p.dt, value: p.value },
        { onConflict: "series_key,source,dt" }
      );
      count++;
    }
    console.log("  SPY: inserted", spyPoints.length, "rows");
  } catch (e) {
    console.error("  SPY failed:", e instanceof Error ? e.message : e);
  }

  try {
    const btcPoints = await fetchBtcDailyRange(BTC_DAYS);
    for (const p of btcPoints) {
      await supabase.from("daily_series").upsert(
        { series_key: p.series_key, source: p.source, dt: p.dt, value: p.value },
        { onConflict: "series_key,source,dt" }
      );
      count++;
    }
    console.log("  BTC: inserted", btcPoints.length, "rows");
  } catch (e) {
    console.error("  BTC failed:", e instanceof Error ? e.message : e);
  }

  for (const [seriesKey, seriesId] of Object.entries(FRED_SERIES)) {
    try {
      const observations = await fetchFredRange(seriesId, fredStart, today);
      for (const { date, value } of observations) {
        await supabase.from("daily_series").upsert(
          { series_key: seriesKey, source: "fred", dt: date, value },
          { onConflict: "series_key,source,dt" }
        );
        count++;
      }
      console.log("  FRED", seriesKey, ": inserted", observations.length, "rows");
    } catch (e) {
      console.error("  FRED", seriesKey, "failed:", e instanceof Error ? e.message : e);
    }
  }

  console.log("Done. Total rows upserted:", count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
