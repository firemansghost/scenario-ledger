import { cookies } from "next/headers";
import { createClient } from "@/lib/supabaseClient";
import { findLastComputedAlignmentWeek } from "@/lib/alignmentHelpers";
import { computeSupportDelta } from "@/lib/evidenceSupport";
import { scoreTripwires, summarizeTripwires } from "@/lib/tripwireStatus";
import { computePathIntegrity } from "@/lib/pathIntegrity";
import { buildPathIntegrityExplain } from "@/lib/pathIntegrityExplain";
import { buildWhatChangedBullets } from "@/lib/whatChanged";
import { getEvidenceForWeek } from "@/lib/getEvidenceForWeek";
import { ForecastAtAGlance } from "@/components/ForecastAtAGlance";
import { NearTermMap } from "@/components/NearTermMap";
import { PredictionsAtAGlanceStrip } from "@/components/PredictionsAtAGlanceStrip";
import { PublishedForecastSummary } from "@/components/PublishedForecastSummary";
import { ScenarioComparisonGrid } from "@/components/ScenarioComparisonGrid";
import { ThisWeekVsForecast } from "@/components/ThisWeekVsForecast";
import { TimeboxStrip } from "@/components/TimeboxStrip";
import { TripwiresSection } from "@/components/TripwiresSection";
import { WhatChangedCard } from "@/components/WhatChangedCard";
import type { ForecastConfig, PeriodBand, ScenarioKey } from "@/lib/types";

export const revalidate = 60;

function findCurrentPeriodIndex(
  periods: { start: string; end: string }[],
  weekEnding: string
): number {
  if (!periods?.length) return 0;
  const we = new Date(weekEnding).getTime();
  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];
    if (we >= new Date(p.start).getTime() && we <= new Date(p.end).getTime()) {
      return i;
    }
  }
  return 0;
}

function findCurrentPeriod(
  periods: PeriodBand[],
  weekEnding: string
): PeriodBand | null {
  if (!periods?.length) return null;
  const we = new Date(weekEnding).getTime();
  for (const p of periods) {
    if (we >= new Date(p.start).getTime() && we <= new Date(p.end).getTime()) {
      return p;
    }
  }
  return periods[0] ?? null;
}

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const params = await searchParams;
  const shareMode = params?.share === "1";
  const supabase = createClient();
  const cookieStore = await cookies();
  const nerdMode = cookieStore.get("scenarioledger_nerd")?.value === "1";
  const { data: forecast } = await supabase
    .from("forecasts")
    .select("id, version, name, config, created_at")
    .eq("is_active", true)
    .maybeSingle();

  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, alignment, btc_close, spy_close, spx_equiv, spx_factor, active_scenario, confidence, forecast_id")
    .order("week_ending", { ascending: false })
    .limit(8);

  const snapshot = snapshots?.[0] ?? null;
  const prevSnapshot = snapshots?.[1] ?? null;
  const snapshotsForSparkline = (snapshots ?? []).slice(0, 8).reverse();

  const [evidence, prevEvidence] = await Promise.all([
    snapshot ? getEvidenceForWeek(supabase, String(snapshot.week_ending)) : Promise.resolve({ indicatorRows: [], definitions: [] }),
    prevSnapshot ? getEvidenceForWeek(supabase, String(prevSnapshot.week_ending)) : Promise.resolve({ indicatorRows: [], definitions: [] }),
  ]);

  const config = forecast?.config as ForecastConfig | null;
  const activeScenario = (snapshot?.active_scenario as ScenarioKey) ?? "base";
  const scenario = config?.scenarios?.[activeScenario];
  const checkpoints = scenario?.checkpoints ?? [];
  const invalidations = scenario?.invalidations ?? [];

  const defsByKeyName = Object.fromEntries(evidence.definitions.map((d) => [d.key, d.name]));

  const defsByKeyForTripwire = Object.fromEntries(
    evidence.definitions.map((d) => [
      d.key,
      { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
    ])
  );
  const tripwireResults =
    snapshot && scenario
      ? scoreTripwires({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenario,
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: prevSnapshot.active_scenario as ScenarioKey,
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          latestIndicators: evidence.indicatorRows,
          defsByKey: defsByKeyForTripwire,
          scenarioConfig: { checkpoints, invalidations },
        })
      : [];
  const tripwireSummary = tripwireResults.length > 0 ? summarizeTripwires(tripwireResults) : undefined;
  const supportDelta =
    snapshot && activeScenario
      ? computeSupportDelta({
          indicatorRows: evidence.indicatorRows,
          defsByKey: defsByKeyForTripwire,
          activeScenario,
        })
      : 0;
  const pathIntegrity =
    snapshot && activeScenario
      ? computePathIntegrity({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenario,
            confidence: snapshot.confidence,
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: prevSnapshot.active_scenario as ScenarioKey,
                confidence: prevSnapshot.confidence,
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          supportDelta,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          prevSupportDelta: prevSnapshot && activeScenario
            ? computeSupportDelta({
                indicatorRows: prevEvidence.indicatorRows,
                defsByKey: Object.fromEntries(
                  prevEvidence.definitions.map((d) => [
                    d.key,
                    { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
                  ])
                ),
                activeScenario,
              })
            : undefined,
          prevTripwireSummary:
            prevSnapshot && activeScenario
              ? summarizeTripwires(
                  scoreTripwires({
                    latestSnapshot: {
                      week_ending: prevSnapshot.week_ending,
                      active_scenario: prevSnapshot.active_scenario as ScenarioKey,
                      alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
                    },
                    latestIndicators: prevEvidence.indicatorRows,
                    defsByKey: Object.fromEntries(
                      prevEvidence.definitions.map((d) => [
                        d.key,
                        { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
                      ])
                    ),
                    scenarioConfig: { checkpoints, invalidations },
                  })
                )
              : undefined,
        })
      : null;

  const pathIntegrityExplain =
    pathIntegrity && snapshot && activeScenario
      ? buildPathIntegrityExplain({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenario,
            confidence: snapshot.confidence,
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: prevSnapshot.active_scenario as ScenarioKey,
                confidence: prevSnapshot.confidence,
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          integrity: pathIntegrity,
          supportDelta,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          scenarioLabel: activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1),
          factor: snapshot.spx_factor ?? undefined,
        })
      : null;

  const whatChangedBullets =
    snapshot && prevSnapshot
      ? buildWhatChangedBullets({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenario,
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: {
            week_ending: prevSnapshot.week_ending,
            active_scenario: prevSnapshot.active_scenario as ScenarioKey,
            alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          indicatorLatest: evidence.indicatorRows,
          indicatorPrev: prevEvidence.indicatorRows,
          defsByKey: defsByKeyName,
        })
      : [];

  const factor = snapshot?.spx_factor ?? config?.meta?.spxToSpyFactor ?? 0.1;
  const periods = config?.scenarios?.[activeScenario]?.periods ?? [];
  const currentPeriodIndex = findCurrentPeriodIndex(periods, snapshot?.week_ending ?? "");
  const currentPeriod = findCurrentPeriod(periods, snapshot?.week_ending ?? "");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Forecast Brief</h1>
      <p className="text-sm text-zinc-400">
        What we published: active forecast and how this week lines up.
      </p>
      {config ? (
        <>
          <div id="forecast-brief" className="grid gap-6 md:grid-cols-2">
            <PublishedForecastSummary
              config={config}
              version={forecast?.version ?? undefined}
              createdAt={forecast?.created_at ?? null}
              activeScenario={activeScenario}
            />
            <NearTermMap config={config} activeScenario={activeScenario} maxBullets={6} />
          </div>
          <PredictionsAtAGlanceStrip
            currentPeriod={currentPeriod}
            activeScenario={activeScenario}
            snapshotsForSparkline={snapshotsForSparkline}
            checkpointsCount={checkpoints.length}
            invalidationsCount={invalidations.length}
            pathIntegrity={pathIntegrity}
            pathIntegrityExplain={pathIntegrityExplain}
            weekEnding={snapshot?.week_ending}
            shareMode={shareMode}
          />
          {snapshot && whatChangedBullets.length > 0 && (
            <WhatChangedCard bullets={whatChangedBullets} shareMode={shareMode} />
          )}
          {snapshot && (
            <section id="this-week" className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <ThisWeekVsForecast
                snapshot={snapshot}
                factor={factor}
                lastComputedWeekEnding={findLastComputedAlignmentWeek(snapshots)}
                nerdMode={nerdMode}
              />
            </section>
          )}
          <section id="timeboxes" className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-medium">Forecast at a glance</h2>
            {periods.length > 0 && (
              <div className="mb-4">
                <TimeboxStrip
                  periods={periods}
                  currentIndex={currentPeriodIndex}
                  shareMode={shareMode}
                />
              </div>
            )}
            <ForecastAtAGlance
              config={config}
              forecastName={forecast?.name ?? undefined}
              version={forecast?.version ?? undefined}
              currentPeriodIndex={currentPeriodIndex}
            />
            <div className="mt-6">
              <TripwiresSection
                checkpoints={checkpoints}
                invalidations={invalidations}
                id="tripwires"
                tripwireResults={tripwireResults}
              />
            </div>
            <div id="comparison" className="mt-6">
              <ScenarioComparisonGrid
                config={config}
                currentPeriodIndex={currentPeriodIndex}
              />
            </div>
          </section>
        </>
      ) : (
        <p className="text-zinc-500">No active forecast. Run seed or set one active.</p>
      )}
    </div>
  );
}
