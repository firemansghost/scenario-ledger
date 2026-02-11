/**
 * Backfill SPY daily history from Stooq (1993-01-01 → today) into daily_series.
 * Chunks by ~2 years per request to avoid giant responses.
 *
 * Usage: npm run backfill:spy-history
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import "./_env";
import { createClient } from "@supabase/supabase-js";
import { fetchStooqSpyDateRange } from "../lib/sources/stooq";

const START_DATE = "1993-01-01";
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
  const end = new Date();
  const start = new Date(START_DATE);
  let totalInserted = 0;

  console.log("SPY history backfill: from", START_DATE, "to", toYYYYMMDD(end));

  while (start < end) {
    const chunkEnd = new Date(start);
    chunkEnd.setFullYear(chunkEnd.getFullYear() + CHUNK_YEARS);
    if (chunkEnd > end) chunkEnd.setTime(end.getTime());
    const d1 = toYYYYMMDD(start);
    const d2 = toYYYYMMDD(chunkEnd);
    try {
      const rows = await fetchStooqSpyDateRange(d1, d2, 3000);
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

  console.log("Done. Total rows upserted:", totalInserted);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
