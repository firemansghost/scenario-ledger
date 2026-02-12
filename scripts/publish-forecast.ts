#!/usr/bin/env node
/**
 * Publish a forecast from a JSON seed file to Supabase.
 * Uses service role. Inserts new version, deactivates prior active.
 * Usage: npm run forecast:publish [path]
 * Default path: seeds/forecast_v2.json
 */
import "./_env";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function readJsonConfig(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("❌ Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const defaultPath = path.join(process.cwd(), "seeds", "forecast_v2.json");
  const filePath = process.argv[2] ?? defaultPath;
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

  console.log(`Reading config from ${resolvedPath}...`);
  const config = readJsonConfig(resolvedPath);

  const supabase = createClient(url, serviceKey);

  const { data: latest, error: selectErr } = await supabase
    .from("forecasts")
    .select("version")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectErr) {
    console.error("❌ Failed to query forecasts:", selectErr.message);
    process.exit(1);
  }

  const nextVersion = latest ? (latest.version as number) + 1 : 1;
  const meta = config.meta as Record<string, unknown> | undefined;
  const name = (meta?.name as string) ?? `Forecast v${nextVersion}`;

  const { error: deactivateErr } = await supabase
    .from("forecasts")
    .update({ is_active: false })
    .eq("is_active", true);

  if (deactivateErr) {
    console.error("❌ Failed to deactivate prior forecasts:", deactivateErr.message);
    process.exit(1);
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("forecasts")
    .insert({
      version: nextVersion,
      name,
      is_active: true,
      notes: "Published via CLI script",
      config,
    })
    .select("id, version, name, created_at, is_active")
    .single();

  if (insertErr) {
    console.error("❌ Failed to insert forecast:", insertErr.message);
    if (insertErr.details) console.error("Details:", insertErr.details);
    process.exit(1);
  }

  const created = inserted?.created_at as string;
  const createdAt = created ? new Date(created).toISOString() : "—";

  console.log("");
  console.log("✅ Published successfully");
  console.log(`   Version: v${nextVersion}`);
  console.log(`   Name: ${name}`);
  console.log(`   Created at: ${createdAt}`);
  console.log(`   Active: true`);
  console.log("");
  console.log("Reminder: forecast configs are immutable. Changes require new versions.");
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
