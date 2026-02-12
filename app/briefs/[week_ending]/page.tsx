import { createClient } from "@/lib/supabaseClient";
import { getEvidenceForWeek } from "@/lib/getEvidenceForWeek";
import { buildWeeklyBrief } from "@/lib/weeklyBrief";
import { MarkSeenWeek } from "@/components/MarkSeenWeek";
import { WeeklyBriefCard } from "@/components/WeeklyBriefCard";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

export const revalidate = 60;

function getPrevWeekEnding(weekEnding: string): string {
  const d = new Date(weekEnding);
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default async function BriefDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ week_ending: string }>;
  searchParams: Promise<{ share?: string }>;
}) {
  const { week_ending } = await params;
  const { share } = await searchParams;
  const shareMode = share === "1";
  const supabase = createClient();

  const { data: snapshot } = await supabase
    .from("weekly_snapshots")
    .select("*")
    .eq("week_ending", week_ending)
    .maybeSingle();

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Brief not found</h1>
        <p className="text-zinc-500">No snapshot for week ending {week_ending}.</p>
        <a href="/briefs" className="text-sm text-zinc-500 hover:text-white">
          ← Back to archive
        </a>
      </div>
    );
  }

  const prevWeekEnding = getPrevWeekEnding(week_ending);
  const [prevSnapshotResult, evidence, prevEvidence, forecastResult, activeForecastResult] = await Promise.all([
    supabase.from("weekly_snapshots").select("*").eq("week_ending", prevWeekEnding).maybeSingle(),
    getEvidenceForWeek(supabase, week_ending),
    getEvidenceForWeek(supabase, prevWeekEnding),
    supabase.from("forecasts").select("config, version").eq("id", snapshot.forecast_id).single(),
    supabase.from("forecasts").select("id, version").eq("is_active", true).maybeSingle(),
  ]);

  const prevSnapshot = prevSnapshotResult.data;
  const forecast = forecastResult.data;
  const activeForecast = activeForecastResult.data;
  const config = forecast?.config as ForecastConfig | null;
  const activeScenarioKey = (snapshot.active_scenario as ScenarioKey) ?? "base";
  const scenarioConfig = activeScenarioKey && config?.scenarios?.[activeScenarioKey]
    ? { checkpoints: config.scenarios[activeScenarioKey].checkpoints ?? [], invalidations: config.scenarios[activeScenarioKey].invalidations ?? [] }
    : undefined;

  const defsByKey = Object.fromEntries(evidence.definitions.map((d) => [d.key, d.name]));
  const align = (snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {};

  const brief = buildWeeklyBrief({
    latestSnapshot: {
      week_ending: snapshot.week_ending,
      active_scenario: activeScenarioKey,
      confidence: snapshot.confidence,
      scenario_probs: (snapshot.scenario_probs as Record<ScenarioKey, number>) ?? {},
      alignment: align,
      top_contributors: snapshot.top_contributors ?? [],
    },
    prevSnapshot: prevSnapshot
      ? {
          week_ending: prevSnapshot.week_ending,
          active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
          confidence: prevSnapshot.confidence,
          scenario_probs: (prevSnapshot.scenario_probs as Record<ScenarioKey, number>) ?? {},
          alignment: (prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {},
          top_contributors: prevSnapshot.top_contributors ?? [],
        }
      : null,
    indicatorLatest: evidence.indicatorRows,
    indicatorPrev: prevEvidence.indicatorRows,
    defsByKey,
    scenarioConfig,
    computedOnForecastVersion: forecast?.version ?? undefined,
    activeForecastVersion:
      activeForecast && activeForecast.id !== snapshot.forecast_id ? activeForecast.version : undefined,
  });

  return (
    <div className="space-y-6">
      <MarkSeenWeek weekEnding={week_ending} shareMode={shareMode} />
      <a href="/briefs" className="text-sm text-zinc-500 hover:text-white">
        ← Back to archive
      </a>
      <WeeklyBriefCard brief={brief} shareMode={shareMode} />
    </div>
  );
}
