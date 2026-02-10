import "./_env";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

type ForecastSeed = Record<string, unknown>;
type AthSeed = { meta: unknown; windows: unknown[] };
type IndicatorSeed = Record<string, unknown>[];

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error("Missing Supabase env vars.");

  const supabase = createClient(url, serviceKey);

  const forecastPath = path.join(process.cwd(), "seeds", "forecast_v1.json");
  const athPath = path.join(process.cwd(), "seeds", "ath_windows_v1.json");
  const indPath = path.join(process.cwd(), "seeds", "indicator_definitions_v1.json");

  const forecastSeed = readJson<ForecastSeed>(forecastPath);
  const athSeed = readJson<AthSeed>(athPath);
  const indicators = readJson<IndicatorSeed>(indPath);

  const mergedConfig = {
    ...forecastSeed,
    athMeta: athSeed.meta,
    athWindows: athSeed.windows,
  };

  for (const ind of indicators) {
    const { error } = await supabase
      .from("indicator_definitions")
      .upsert(
        {
          key: ind.key as string,
          name: ind.name as string,
          description: (ind.description as string) ?? null,
          calc: ind.calc,
          thresholds: ind.thresholds,
          weights: ind.weights,
          enabled: (ind.enabled as boolean) ?? true,
        },
        { onConflict: "key" }
      );
    if (error) throw error;
  }

  {
    const { error } = await supabase.from("forecasts").update({ is_active: false }).neq("version", 0);
    if (error) throw error;
  }

  const { data: existing, error: existErr } = await supabase
    .from("forecasts")
    .select("id, version")
    .eq("version", 1)
    .maybeSingle();
  if (existErr) throw existErr;

  if (!existing) {
    const { error } = await supabase.from("forecasts").insert({
      version: 1,
      name: (mergedConfig as { meta?: { name?: string } })?.meta?.name ?? "ScenarioLedger Forecast v1",
      is_active: true,
      notes: "Seeded initial forecast + ATH windows",
      config: mergedConfig,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("forecasts").update({ is_active: true }).eq("version", 1);
    if (error) throw error;
  }

  console.log("✅ Seed completed.");
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
