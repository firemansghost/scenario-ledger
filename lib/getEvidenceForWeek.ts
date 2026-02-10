import type { SupabaseClient } from "@supabase/supabase-js";

export interface EvidenceRow {
  indicator_key: string;
  value: number | null;
  delta: number | null;
  state: string;
}

export interface EvidenceDefinition {
  key: string;
  name: string;
  weights: unknown;
}

export interface EvidenceForWeekResult {
  indicatorRows: EvidenceRow[];
  definitions: EvidenceDefinition[];
}

/**
 * Load indicator_weekly and indicator_definitions for a given week_ending.
 * Use for Dashboard receipts panel and any evidence drilldown for that week.
 */
export async function getEvidenceForWeek(
  supabase: SupabaseClient,
  weekEnding: string
): Promise<EvidenceForWeekResult> {
  const { data: ind } = await supabase
    .from("indicator_weekly")
    .select("indicator_key, value, delta, state")
    .eq("week_ending", weekEnding);

  const { data: defs } = await supabase
    .from("indicator_definitions")
    .select("key, name, weights");

  const indicatorRows: EvidenceRow[] = (ind ?? []).map((r) => ({
    indicator_key: r.indicator_key ?? "",
    value: r.value != null ? Number(r.value) : null,
    delta: r.delta != null ? Number(r.delta) : null,
    state: r.state ?? "",
  }));

  const definitions: EvidenceDefinition[] = (defs ?? []).map((d) => ({
    key: d.key ?? "",
    name: d.name ?? "",
    weights: d.weights ?? {},
  }));

  return { indicatorRows, definitions };
}
