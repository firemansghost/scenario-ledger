import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Get daily value for series_key + dt: manual_overrides take precedence over daily_series.
 */
export async function getDailyValue(
  supabase: SupabaseClient,
  seriesKey: string,
  dt: string
): Promise<number | null> {
  const { data: override } = await supabase
    .from("manual_overrides")
    .select("value")
    .eq("series_key", seriesKey)
    .eq("dt", dt)
    .maybeSingle();

  if (override != null) return Number(override.value);

  const { data: row } = await supabase
    .from("daily_series")
    .select("value")
    .eq("series_key", seriesKey)
    .eq("dt", dt)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return row != null ? Number(row.value) : null;
}
