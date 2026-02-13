import { createClient } from "@/lib/supabaseClient";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getDataHealth } from "@/lib/dataHealth";
import { getEvidenceForWeek } from "@/lib/getEvidenceForWeek";
import { findLastComputedAlignmentWeek } from "@/lib/alignmentHelpers";
import { computeSupportDelta } from "@/lib/evidenceSupport";
import { scoreTripwires, summarizeTripwires } from "@/lib/tripwireStatus";
import { computePathIntegrity } from "@/lib/pathIntegrity";
import { buildPathIntegrityExplain } from "@/lib/pathIntegrityExplain";
import { buildWeeklyPlaybook } from "@/lib/playbook";
import { prettifyKey } from "@/lib/format";
import { buildWeeklyBrief } from "@/lib/weeklyBrief";
import { CopySummaryButton } from "@/components/CopySummaryButton";
import { DashboardNowNextWatch } from "@/components/DashboardNowNextWatch";
import { DashboardAlignmentTiles } from "@/components/DashboardAlignmentTiles";
import { ScenarioProbChips } from "@/components/ScenarioProbChips";
import { DataHealthCard } from "@/components/DataHealthCard";
import { DataStatusBadge } from "@/components/data-status-badge";
import { ReceiptsPanel } from "@/components/ReceiptsPanel";
import { DashboardIntro } from "@/components/DashboardIntro";
import { NewSinceLastVisitCard } from "@/components/NewSinceLastVisitCard";
import { SignalBoardCard } from "@/components/SignalBoardCard";
import { WeeklyPlaybookCard } from "@/components/WeeklyPlaybookCard";
import { StreakMeterCard } from "@/components/StreakMeterCard";
import { WeeklyBriefCard } from "@/components/WeeklyBriefCard";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

type AlignRecord = Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>;

function buildCopySummaryText(params: {
  weekEnding: string;
  activeScenario: string;
  scenarioProbs: Record<string, number>;
  indicatorRows: { indicator_key: string; state: string }[];
  definitions: { key: string; name: string }[];
  lastDailyIngestAt: string | null;
}): string {
  const { weekEnding, activeScenario, scenarioProbs, indicatorRows, definitions, lastDailyIngestAt } = params;
  const defMap = Object.fromEntries(definitions.map((d) => [d.key, d.name]));
  const lines: string[] = [
    `ScenarioLedger — Week ending ${weekEnding}`,
    `Active scenario: ${activeScenario}`,
    `Probabilities: Base ${Math.round((scenarioProbs.base ?? 0) * 100)}% | Bull ${Math.round((scenarioProbs.bull ?? 0) * 100)}% | Bear ${Math.round((scenarioProbs.bear ?? 0) * 100)}%`,
    "",
    "Evidence (weekly):",
  ];
  for (const row of indicatorRows) {
    const name = defMap[row.indicator_key]?.trim() || prettifyKey(row.indicator_key);
    lines.push(`- ${name}: ${row.state}`);
  }
  if (lastDailyIngestAt) {
    const d = new Date(lastDailyIngestAt);
    const ct = d.toLocaleString("en-US", { timeZone: "America/Chicago" });
    lines.push("");
    lines.push(`Last daily ingest: ${ct} CT`);
  }
  return lines.join("\n");
}

export async function Dashboard(props: { shareMode?: boolean; nerdMode?: boolean }) {
  const shareMode = props.shareMode === true;
  const nerdMode = props.nerdMode === true;
  const supabase = createClient();
  const supabaseService = createServiceRoleClient();

  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("*")
    .order("week_ending", { ascending: false })
    .limit(9);

  const snapshot = snapshots?.[0] ?? null;
  const prevSnapshot = snapshots?.[1] ?? null;
  const snapshotsForSparkline = (snapshots ?? []).slice(0, 8).reverse();

  const [dataHealth, evidence, prevEvidence] = await Promise.all([
    getDataHealth(supabaseService),
    snapshot
      ? getEvidenceForWeek(supabase, String(snapshot.week_ending))
      : Promise.resolve({ indicatorRows: [], definitions: [] }),
    prevSnapshot
      ? getEvidenceForWeek(supabase, String(prevSnapshot.week_ending))
      : Promise.resolve({ indicatorRows: [], definitions: [] }),
  ]);

  const [forecastResult, activeForecastResult] = await Promise.all([
    snapshot
      ? supabase.from("forecasts").select("config, version, created_at").eq("id", snapshot.forecast_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("forecasts").select("id, version, config, created_at").eq("is_active", true).maybeSingle(),
  ]);

  const forecast = forecastResult.data;
  const activeForecast = activeForecastResult.data;
  const forecastVersion = forecast?.version ?? null;
  const activeForecastConfig = (activeForecast?.config ?? forecast?.config) as ForecastConfig | null;
  const computedOnForecastVersion = forecast?.version ?? null;
  const activeForecastVersion =
    activeForecast && snapshot && activeForecast.id !== snapshot.forecast_id
      ? activeForecast.version
      : undefined;
  const defMap = Object.fromEntries(evidence.definitions.map((d) => [d.key, d.name]));
  const evidenceSummaryLines = evidence.indicatorRows.slice(0, 3).map(
    (r) => `${defMap[r.indicator_key]?.trim() || prettifyKey(r.indicator_key)}: ${r.state}`
  );

  const copySummaryText =
    snapshot && evidence.definitions.length
      ? buildCopySummaryText({
          weekEnding: String(snapshot.week_ending),
          activeScenario: snapshot.active_scenario,
          scenarioProbs: (snapshot.scenario_probs as Record<string, number>) ?? {},
          indicatorRows: evidence.indicatorRows.map((r) => ({ indicator_key: r.indicator_key, state: r.state })),
          definitions: evidence.definitions.map((d) => ({ key: d.key, name: d.name })),
          lastDailyIngestAt: dataHealth.dailyRun?.started_at ?? null,
        })
      : "";

  const config = activeForecastConfig;
  const activeScenarioKey = snapshot?.active_scenario as ScenarioKey | undefined;
  const align = (snapshot?.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {};

  const defsByKey = Object.fromEntries(evidence.definitions.map((d) => [d.key, d.name]));
  const defsByKeyForTripwire = Object.fromEntries(
    evidence.definitions.map((d) => [
      d.key,
      { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
    ])
  );
  const forecastConfigForBrief = (forecast?.config as ForecastConfig | null) ?? null;
  const scenarioConfig = activeScenarioKey && forecastConfigForBrief?.scenarios?.[activeScenarioKey]
    ? { checkpoints: forecastConfigForBrief.scenarios[activeScenarioKey].checkpoints ?? [], invalidations: forecastConfigForBrief.scenarios[activeScenarioKey].invalidations ?? [] }
    : undefined;

  const tripwireResults =
    snapshot && activeScenarioKey
      ? scoreTripwires({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey ?? "base",
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          latestIndicators: evidence.indicatorRows,
          defsByKey: defsByKeyForTripwire,
          scenarioConfig: scenarioConfig ?? { checkpoints: [], invalidations: [] },
        })
      : [];
  const tripwireSummary = tripwireResults.length > 0 ? summarizeTripwires(tripwireResults) : undefined;

  const supportDelta = snapshot && activeScenarioKey
    ? computeSupportDelta({
        indicatorRows: evidence.indicatorRows,
        defsByKey: defsByKeyForTripwire,
        activeScenario: activeScenarioKey,
      })
    : 0;

  const pathIntegrity =
    snapshot && activeScenarioKey
      ? computePathIntegrity({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey,
            confidence: snapshot.confidence,
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                confidence: prevSnapshot.confidence,
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          supportDelta,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          prevSupportDelta: prevSnapshot && activeScenarioKey
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
          prevTripwireSummary: prevSnapshot && activeScenarioKey && (forecastConfigForBrief?.scenarios?.[prevSnapshot.active_scenario as ScenarioKey])
            ? summarizeTripwires(
                scoreTripwires({
                  latestSnapshot: {
                    week_ending: prevSnapshot.week_ending,
                    active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                    alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
                  },
                  latestIndicators: prevEvidence.indicatorRows,
                  defsByKey: Object.fromEntries(
                    prevEvidence.definitions.map((d) => [
                      d.key,
                      { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
                    ])
                  ),
                  scenarioConfig: {
                    checkpoints: forecastConfigForBrief?.scenarios?.[prevSnapshot.active_scenario as ScenarioKey]?.checkpoints ?? [],
                    invalidations: forecastConfigForBrief?.scenarios?.[prevSnapshot.active_scenario as ScenarioKey]?.invalidations ?? [],
                  },
                })
              )
            : undefined,
        })
      : null;

  const integrityScoresForSparkline: (number | null)[] = [];
  if (snapshotsForSparkline.length > 0 && forecastConfigForBrief) {
    const evidenceByWeek = await Promise.all(
      snapshotsForSparkline.map((s) =>
        getEvidenceForWeek(supabase, String(s.week_ending))
      )
    );
    for (let i = 0; i < snapshotsForSparkline.length; i++) {
      const s = snapshotsForSparkline[i];
      const ev = evidenceByWeek[i];
      const asc = (s.active_scenario as ScenarioKey) ?? "base";
      const sc = forecastConfigForBrief.scenarios?.[asc];
      if (!sc) {
        integrityScoresForSparkline.push(60);
        continue;
      }
      const defs = Object.fromEntries(
        ev.definitions.map((d) => [
          d.key,
          { name: d.name, weights: d.weights as Record<string, Partial<Record<string, number>>> },
        ])
      );
      const sd = computeSupportDelta({ indicatorRows: ev.indicatorRows, defsByKey: defs, activeScenario: asc });
      const tr = scoreTripwires({
        latestSnapshot: { week_ending: s.week_ending, active_scenario: asc, alignment: s.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined> },
        latestIndicators: ev.indicatorRows,
        defsByKey: defs,
        scenarioConfig: { checkpoints: sc.checkpoints ?? [], invalidations: sc.invalidations ?? [] },
      });
      const ts = summarizeTripwires(tr);
      const pi = computePathIntegrity({
        latestSnapshot: { week_ending: s.week_ending, active_scenario: asc, confidence: s.confidence, alignment: s.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined> },
        supportDelta: sd,
        tripwireSummary: ts,
      });
      integrityScoresForSparkline.push(pi.score);
    }
  }

  function formatDrift(inBand: boolean, driftPct?: number): string {
    if (inBand) return "In (0.0%)";
    if (driftPct != null) {
      const sign = driftPct >= 0 ? "+" : "";
      return `Out (${sign}${driftPct.toFixed(1)}%)`;
    }
    return "—";
  }
  const baseAlign = align[activeScenarioKey ?? "base"] ?? align["base"];
  const btcStatus = baseAlign?.btc != null ? formatDrift(baseAlign.btc.inBand, baseAlign.btc.driftPct) : "—";
  const eqStatus = baseAlign?.spy != null ? formatDrift(baseAlign.spy.inBand, baseAlign.spy.driftPct) : "—";
  const btcDrift = baseAlign?.btc?.inBand ? 0 : (baseAlign?.btc?.driftPct ?? null);
  const eqDrift = baseAlign?.spy?.inBand ? 0 : (baseAlign?.spy?.driftPct ?? null);

  const weeklyPlaybook =
    pathIntegrity && scenarioConfig
      ? buildWeeklyPlaybook({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey ?? "base",
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          scenarioConfig,
          tripwireResults,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          supportDelta,
          integrity: pathIntegrity,
          integrityTrend: integrityScoresForSparkline.filter((v): v is number => v != null),
          btcDrift,
          eqDrift,
        })
      : null;

  const pathIntegrityExplain =
    pathIntegrity && snapshot && activeScenarioKey
      ? buildPathIntegrityExplain({
          latestSnapshot: {
            week_ending: snapshot.week_ending,
            active_scenario: activeScenarioKey,
            confidence: snapshot.confidence,
            alignment: snapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
          },
          prevSnapshot: prevSnapshot
            ? {
                week_ending: prevSnapshot.week_ending,
                active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
                confidence: prevSnapshot.confidence,
                alignment: prevSnapshot.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>,
              }
            : null,
          integrity: pathIntegrity,
          supportDelta,
          tripwireSummary: tripwireSummary ?? { confirming: 0, watching: 0, risk: 0 },
          scenarioLabel: (activeScenarioKey ?? "base").charAt(0).toUpperCase() + (activeScenarioKey ?? "base").slice(1),
          factor: snapshot.spx_factor ?? undefined,
        })
      : null;

  const prevTopContributors = prevSnapshot?.top_contributors ?? [];
  const latestTopContributors = snapshot?.top_contributors ?? [];

  const prevForNewCard = prevSnapshot
    ? {
        week_ending: prevSnapshot.week_ending,
        active_scenario: (prevSnapshot.active_scenario as ScenarioKey) ?? "base",
        confidence: prevSnapshot.confidence,
        scenario_probs: (prevSnapshot.scenario_probs as Record<ScenarioKey, number>) ?? {},
        alignment: prevSnapshot.alignment as AlignRecord,
        top_contributors: prevTopContributors,
      }
    : null;

  const latestForNewCard = snapshot
    ? {
        week_ending: snapshot.week_ending,
        active_scenario: (snapshot.active_scenario as ScenarioKey) ?? "base",
        confidence: snapshot.confidence,
        scenario_probs: (snapshot.scenario_probs as Record<ScenarioKey, number>) ?? {},
        alignment: snapshot.alignment as AlignRecord,
        top_contributors: latestTopContributors,
      }
    : null;

  const weeklyBrief = snapshot
    ? buildWeeklyBrief({
        latestSnapshot: {
          week_ending: snapshot.week_ending,
          active_scenario: (snapshot.active_scenario as ScenarioKey) ?? "base",
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
        computedOnForecastVersion: computedOnForecastVersion ?? undefined,
        activeForecastVersion,
      })
    : null;

  return (
    <div className="space-y-6">
      {snapshot ? (
        <>
          {shareMode && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CopySummaryButton summaryText={copySummaryText} />
              <p className="text-xs text-zinc-500">Educational speculation. Not investment advice.</p>
            </div>
          )}
          {pathIntegrity && (
            <SignalBoardCard
              integrity={pathIntegrity}
              shareMode={shareMode}
              weekEnding={String(snapshot.week_ending)}
              forecastVersion={forecastVersion ?? undefined}
              activeScenarioLabel={(activeScenarioKey ?? "base").charAt(0).toUpperCase() + (activeScenarioKey ?? "base").slice(1)}
              confidence={snapshot.confidence}
              btcStatus={btcStatus}
              eqStatus={eqStatus}
              integrityScoresForSparkline={integrityScoresForSparkline}
              explain={pathIntegrityExplain}
              canonicalUrl={`/briefs/${snapshot.week_ending}`}
            />
          )}
          {weeklyPlaybook && (
            <WeeklyPlaybookCard
              playbook={weeklyPlaybook}
              weekEnding={String(snapshot.week_ending)}
              shareMode={shareMode}
              nerdMode={nerdMode}
              links={{
                forecastBrief: shareMode ? "/predictions?share=1#tripwires" : "/predictions#tripwires",
                tripwiresAnchor: shareMode ? "/predictions?share=1#tripwires" : "/predictions#tripwires",
                alignment: shareMode ? "/alignment?share=1" : "/alignment",
                evidence: shareMode ? "/evidence?share=1" : "/evidence",
                briefsWeek: shareMode ? `/briefs/${snapshot.week_ending}?share=1` : `/briefs/${snapshot.week_ending}`,
              }}
            />
          )}
          {weeklyBrief && (
            <WeeklyBriefCard
              brief={weeklyBrief}
              shareMode={shareMode}
              lastComputedWeekEnding={findLastComputedAlignmentWeek(snapshots)}
              nerdMode={nerdMode}
              tripwireSummary={tripwireSummary}
            />
          )}
          {!shareMode && prevSnapshot && prevForNewCard && latestForNewCard && (
            <NewSinceLastVisitCard
              latestWeekEnding={String(snapshot.week_ending)}
              prevSnapshot={prevForNewCard}
              latestSnapshot={latestForNewCard}
              indicatorLatest={evidence.indicatorRows}
              indicatorPrev={prevEvidence.indicatorRows}
              defsByKey={defsByKey}
              shareMode={shareMode}
            />
          )}
          {!shareMode && (
            <StreakMeterCard
              checkinWeek={String(snapshot.week_ending)}
              shareMode={shareMode}
              nerdMode={nerdMode}
            />
          )}
          <DashboardIntro shareMode={shareMode} />
          {config && activeScenarioKey && (
            <DashboardNowNextWatch
              latestSnapshot={{
                week_ending: snapshot.week_ending,
                active_scenario: activeScenarioKey,
                confidence: snapshot.confidence,
                top_contributors: snapshot.top_contributors ?? [],
              }}
              forecastConfig={config}
              forecastVersion={activeForecast?.version ?? forecastVersion}
              createdAt={activeForecast?.created_at ?? forecast?.created_at ?? null}
              activeScenarioKey={activeScenarioKey}
              shareMode={shareMode}
              nerdMode={nerdMode}
              defsByKey={defsByKey}
            />
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardAlignmentTiles
              alignment={align}
              activeScenarioKey={activeScenarioKey ?? "base"}
              weekEnding={snapshot.week_ending}
              snapshotsForSparkline={snapshotsForSparkline}
              nerdMode={nerdMode}
              lastComputedWeekEnding={findLastComputedAlignmentWeek(snapshots)}
            />
            <ScenarioProbChips
              scenarioProbs={(snapshot.scenario_probs as Record<ScenarioKey, number>) ?? {}}
              prevScenarioProbs={prevSnapshot ? (prevSnapshot.scenario_probs as Record<ScenarioKey, number>) : null}
              snapshotsForSparkline={snapshotsForSparkline}
            />
          </div>
          {evidenceSummaryLines.length > 0 && (
            <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
              <h2 className="mb-1.5 text-sm font-medium text-zinc-400">Evidence summary</h2>
              <ul className="text-sm text-zinc-300">
                {evidenceSummaryLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          )}
          <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50">
            <summary className="cursor-pointer list-none p-4 text-sm font-medium text-zinc-400 hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
              Details (optional)
            </summary>
            <div className="space-y-4 border-t border-zinc-800 p-4 pt-0">
              <div>
                <h2 className="mb-2 text-sm font-medium text-zinc-400">Latest weekly closes</h2>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-zinc-500">BTC</dt>
                    <dd className="font-mono">
                      {snapshot.btc_close != null ? `$${Number(snapshot.btc_close).toLocaleString()}` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">SPX (equiv)</dt>
                    <dd className="font-mono">
                      {snapshot.spx_equiv != null ? Number(snapshot.spx_equiv).toFixed(2) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">SPY actual</dt>
                    <dd className="font-mono">
                      {snapshot.spy_close != null ? Number(snapshot.spy_close).toFixed(2) : "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-zinc-500">Week ending {snapshot.week_ending}</p>
              </div>
              <DataStatusBadge
                dataCompleteness={snapshot.data_completeness}
                weekEnding={snapshot.week_ending}
              />
            </div>
          </details>
          {nerdMode && !shareMode && (
            <details className="group rounded-lg border border-zinc-800 bg-zinc-900/50">
              <summary className="cursor-pointer list-none p-4 text-sm font-medium text-zinc-400 hover:text-zinc-300 [&::-webkit-details-marker]:hidden">
                Nerd Mode: Data health &amp; receipts
              </summary>
              <div className="space-y-4 border-t border-zinc-800 p-4 pt-0">
                <DataHealthCard data={dataHealth} />
                <ReceiptsPanel
                  weekEnding={String(snapshot.week_ending)}
                  indicatorRows={evidence.indicatorRows}
                  definitions={evidence.definitions}
                  initialOpen={false}
                />
                {copySummaryText && (
                  <div className="flex items-center gap-2">
                    <CopySummaryButton summaryText={copySummaryText} />
                  </div>
                )}
              </div>
            </details>
          )}
        </>
      ) : (
        <>
          {!shareMode && <StreakMeterCard checkinWeek={null} shareMode={shareMode} />}
          <DashboardIntro shareMode={shareMode} />
          <p className="text-zinc-400">No weekly snapshot yet. Run the weekly cron or seed data.</p>
        </>
      )}
    </div>
  );
}
