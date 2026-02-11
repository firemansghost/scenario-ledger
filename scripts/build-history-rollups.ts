/**
 * Build history_rollups from daily_series (SPY) and static BTC cycle data.
 * Run after backfill:spy-history (and optionally backfill:btc-history).
 *
 * Usage: npm run history:build
 */
import "./_env";
import { createClient } from "@supabase/supabase-js";
import { buildHistoryRollups } from "../lib/buildHistoryRollups";

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

async function main() {
  const supabase = createSupabase();
  const result = await buildHistoryRollups(supabase);
  console.log("  btc_cycle_daycounts_v1 written:", result.btcWritten);
  console.log("  spy_presidential_cycle_v1 written:", result.spyWritten);
  console.log("  Last computed_at:", result.lastComputedAt);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
