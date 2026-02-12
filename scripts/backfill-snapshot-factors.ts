/**
 * Backfill spx_factor and spx_equiv for existing snapshots where they are null.
 * Also recomputes alignment with the derived factor so spyRangeApprox is frozen.
 *
 * Usage: tsx scripts/backfill-snapshot-factors.ts
 */
import "./_env";
import { createClient } from "@supabase/supabase-js";
import { getLatestDailyValueOnOrBefore } from "../lib/overrides";
import { computeSpxFactor } from "../lib/equityProxy";
import { computeAlignment } from "../lib/alignment";
import type { ForecastConfig } from "../lib/types";

function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase env vars.");
  return createClient(url, serviceKey);
}

async function main() {
  const supabase = createServiceRoleClient();

  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, spy_close, btc_close, alignment, forecast_id")
    .is("spx_factor", null)
    .not("spy_close", "is", null)
    .order("week_ending", { ascending: true });

  if (!snapshots?.length) {
    console.log("No snapshots to backfill (spx_factor null with spy_close present).");
    return;
  }

  const { data: forecastRow } = await supabase
    .from("forecasts")
    .select("id, config")
    .eq("is_active", true)
    .single();

  if (!forecastRow) {
    console.error("No active forecast.");
    process.exit(1);
  }

  const config = forecastRow.config as ForecastConfig;
  let updated = 0;

  for (const s of snapshots) {
    const spx_close = await getLatestDailyValueOnOrBefore(supabase, "spx", s.week_ending);
    if (spx_close == null) {
      console.warn(`  ${s.week_ending}: missing SPX close, skipping`);
      continue;
    }

    const spy_close = Number(s.spy_close);
    const spx_factor = computeSpxFactor(spy_close, spx_close);
    if (spx_factor == null) {
      console.warn(`  ${s.week_ending}: could not compute factor, skipping`);
      continue;
    }

    const { alignment, spx_equiv } = computeAlignment({
      config,
      weekEnding: s.week_ending,
      btcClose: s.btc_close != null ? Number(s.btc_close) : null,
      spyClose: spy_close,
      spxFactor: spx_factor,
    });

    const { error } = await supabase
      .from("weekly_snapshots")
      .update({
        spx_factor,
        spx_equiv,
        alignment,
      })
      .eq("week_ending", s.week_ending);

    if (error) {
      console.error(`  ${s.week_ending}: ${error.message}`);
      continue;
    }

    updated++;
    console.log(`  ${s.week_ending}: factor=${spx_factor.toFixed(4)}, spx_equiv=${spx_equiv?.toFixed(2)}`);
  }

  console.log(`Done. Updated ${updated} snapshot(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
