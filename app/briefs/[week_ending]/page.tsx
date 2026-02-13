import { cookies } from "next/headers";
import { createClient } from "@/lib/supabaseClient";
import { findLastComputedAlignmentWeek } from "@/lib/alignmentHelpers";
import { computeSupportDelta } from "@/lib/evidenceSupport";
import { scoreTripwires, summarizeTripwires } from "@/lib/tripwireStatus";
import { computePathIntegrity } from "@/lib/pathIntegrity";
import { buildPathIntegrityExplain } from "@/lib/pathIntegrityExplain";
import { buildWeeklyPlaybook } from "@/lib/playbook";
import { getEvidenceForWeek } from "@/lib/getEvidenceForWeek";
import { buildWeeklyBrief } from "@/lib/weeklyBrief";
import { MarkSeenWeek } from "@/components/MarkSeenWeek";
import { SignalBoardCard } from "@/components/SignalBoardCard";
import { WeeklyBriefCard } from "@/components/WeeklyBriefCard";
import { WeeklyPlaybookCard } from "@/components/WeeklyPlaybookCard";
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
  const cookieStore = await cookies();
  const nerdMode = cookieStore.get("scenarioledger_nerd")?.value === "1";
  const snapshotsForLastComputed = [snapshot, prevSnapshot].filter(Boolean);
  const activeForecast = activeForecastResult.data;
  const config = forecast?.config as ForecastConfig | null;
  const activeScenarioKey = (snapshot.active_scenario as ScenarioKey) ?? "base";
  const scenarioConfig = activeScenarioKey && config?.scenarios?.[activeScenarioKey]
    ? { checkpoints: config.scenarios[activeScenarioKey].checkpoints ?? [], invalidations: config.scenarios[activeScenarioKey].invalidations ?? [] }
    : undefined;

  const defsByKey = Object.fromEntries(evidence.definitions.map((d) => [d.key, d.name]));
  const defsByKeyForTripwire = Object.fromEntries(
    evidence.definitions.map((d) => [
      d.key,
      { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
    ])
  );
  const align = (snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {};

  const tripwireResults = scenarioConfig
    ? scoreTripwires({
        latestSnapshot: {
          week_ending: snapshot.week_ending,
          active_scenario: activeScenarioKey,
          alignment: align,
        },
        prevSnapshot: prevSnapshot
          ? {
              week_ending: prevSnapshot.week_ending,
              active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
              alignment: (prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {},
            }
          : null,
        latestIndicators: evidence.indicatorRows,
        defsByKey: defsByKeyForTripwire,
        scenarioConfig,
      })
    : [];
  const tripwireSummary = tripwireResults.length > 0 ? summarizeTripwires(tripwireResults) : undefined;

  const supportDelta = scenarioConfig
    ? computeSupportDelta({
        indicatorRows: evidence.indicatorRows,
        defsByKey: defsByKeyForTripwire,
        activeScenario: activeScenarioKey,
      })
    : 0;

  const pathIntegrity =
    scenarioConfig
      ? computePathIntegrity({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey,
            confidence: snapshot.confidence,
            alignment: align,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                confidence: prevSnapshot.confidence,
                alignment: (prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {},
              }
            : null,
          supportDelta,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          prevSupportDelta: prevSnapshot && scenarioConfig
            ? computeSupportDelta({
                indicatorRows: prevEvidence.indicatorRows,
                defsByKey: Object.fromEntries(
                  prevEvidence.definitions.map((d) => [
                    d.key,
                    { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
                  ])
                ),
                activeScenario: activeScenarioKey,
              })
            : undefined,
          prevTripwireSummary: prevSnapshot && scenarioConfig
            ? summarizeTripwires(
                scoreTripwires({
                  latestSnapshot: {
                    week_ending: prevSnapshot.week_ending,
                    active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                    alignment: (prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {},
                  },
                  latestIndicators: prevEvidence.indicatorRows,
                  defsByKey: Object.fromEntries(
                    prevEvidence.definitions.map((d) => [
                      d.key,
                      { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
                    ])
                  ),
                  scenarioConfig,
                })
              )
            : undefined,
        })
      : null;

  function formatDrift(inBand: boolean, driftPct?: number): string {
    if (inBand) return "In (0.0%)";
    if (driftPct != null) {
      const sign = driftPct >= 0 ? "+" : "";
      return `Out (${sign}${driftPct.toFixed(1)}%)`;
    }
    return "—";
  }
  const baseAlign = align[activeScenarioKey] ?? align["base"];
  const btcStatus = baseAlign?.btc != null ? formatDrift(baseAlign.btc.inBand, baseAlign.btc.driftPct) : "—";
  const eqStatus = baseAlign?.spy != null ? formatDrift(baseAlign.spy.inBand, baseAlign.spy.driftPct) : "—";
  const btcDrift = baseAlign?.btc?.inBand ? 0 : (baseAlign?.btc?.driftPct ?? null);
  const eqDrift = baseAlign?.spy?.inBand ? 0 : (baseAlign?.spy?.driftPct ?? null);

  const weeklyPlaybook =
    pathIntegrity && scenarioConfig
      ? buildWeeklyPlaybook({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey,
            alignment: align,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                alignment: (prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {},
              }
            : null,
          scenarioConfig,
          tripwireResults,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          supportDelta,
          integrity: pathIntegrity,
          btcDrift,
          eqDrift,
        })
      : null;

  const pathIntegrityExplain =
    pathIntegrity && scenarioConfig
      ? buildPathIntegrityExplain({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey,
            confidence: snapshot.confidence,
            alignment: align,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                confidence: prevSnapshot.confidence,
                alignment: (prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {},
              }
            : null,
          integrity: pathIntegrity,
          supportDelta,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          scenarioLabel: activeScenarioKey.charAt(0).toUpperCase() + activeScenarioKey.slice(1),
          factor: snapshot.spx_factor ?? undefined,
        })
      : null;

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
      <a href={shareMode ? "/briefs?share=1" : "/briefs"} className="text-sm text-zinc-500 hover:text-white">
        ← Back to archive
      </a>
      {pathIntegrity && (
        <SignalBoardCard
          integrity={pathIntegrity}
          shareMode={shareMode}
          weekEnding={week_ending}
          forecastVersion={forecast?.version}
          activeScenarioLabel={activeScenarioKey.charAt(0).toUpperCase() + activeScenarioKey.slice(1)}
          confidence={snapshot.confidence}
          btcStatus={btcStatus}
          eqStatus={eqStatus}
          explain={pathIntegrityExplain}
          canonicalUrl={`/briefs/${week_ending}`}
        />
      )}
      {weeklyPlaybook && (
        <WeeklyPlaybookCard
          playbook={weeklyPlaybook}
          weekEnding={week_ending}
          shareMode={shareMode}
          nerdMode={nerdMode}
          links={{
            forecastBrief: shareMode ? "/predictions?share=1#tripwires" : "/predictions#tripwires",
            tripwiresAnchor: shareMode ? "/predictions?share=1#tripwires" : "/predictions#tripwires",
            alignment: shareMode ? "/alignment?share=1" : "/alignment",
            evidence: shareMode ? "/evidence?share=1" : "/evidence",
            briefsWeek: shareMode ? `/briefs/${week_ending}?share=1` : `/briefs/${week_ending}`,
          }}
        />
      )}
      <WeeklyBriefCard
        brief={brief}
        shareMode={shareMode}
        lastComputedWeekEnding={findLastComputedAlignmentWeek(snapshotsForLastComputed)}
        nerdMode={nerdMode}
        tripwireSummary={tripwireSummary}
      />
    </div>
  );
}
