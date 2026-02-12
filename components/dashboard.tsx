import { createClient } from "@/lib/supabaseClient";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getDataHealth } from "@/lib/dataHealth";
import { getEvidenceForWeek } from "@/lib/getEvidenceForWeek";
import { CopySummaryButton } from "@/components/CopySummaryButton";
import { DashboardNowNextWatch } from "@/components/DashboardNowNextWatch";
import { DashboardAlignmentTiles } from "@/components/DashboardAlignmentTiles";
import { ScenarioProbChips } from "@/components/ScenarioProbChips";
import { DataHealthCard } from "@/components/DataHealthCard";
import { DataStatusBadge } from "@/components/data-status-badge";
import { HowToRead } from "@/components/HowToRead";
import { MissionBanner } from "@/components/MissionBanner";
import { ReceiptsPanel } from "@/components/ReceiptsPanel";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

function buildCopySummaryText(params: {
  weekEnding: string;
  activeScenario: string;
  scenarioProbs: Record<string, number>;
  indicatorRows: { indicator_key: string; state: string }[];
  definitions: { key: string; name: string }[];
  lastDailyIngestAt: string | null;
}): string {
  const { weekEnding, activeScenario, scenarioProbs, indicatorRows, definitions, lastDailyIngestAt } = params;
  const defMap = Object.fromEntries(definitions.map((d) => [d.key, d]));
  const lines: string[] = [
    `ScenarioLedger — Week ending ${weekEnding}`,
    `Active scenario: ${activeScenario}`,
    `Probabilities: Base ${Math.round((scenarioProbs.base ?? 0) * 100)}% | Bull ${Math.round((scenarioProbs.bull ?? 0) * 100)}% | Bear ${Math.round((scenarioProbs.bear ?? 0) * 100)}%`,
    "",
    "Evidence (weekly):",
  ];
  for (const row of indicatorRows) {
    const name = defMap[row.indicator_key]?.name ?? row.indicator_key;
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
    .limit(2);

  const snapshot = snapshots?.[0] ?? null;
  const prevSnapshot = snapshots?.[1] ?? null;

  const [dataHealth, evidence] = await Promise.all([
    getDataHealth(supabaseService),
    snapshot
      ? getEvidenceForWeek(supabase, String(snapshot.week_ending))
      : Promise.resolve({ indicatorRows: [], definitions: [] }),
  ]);

  const { data: forecast } = snapshot
    ? await supabase.from("forecasts").select("config, version, created_at").eq("id", snapshot.forecast_id).single()
    : { data: null };

  const forecastVersion = forecast?.version ?? null;
  const defMap = Object.fromEntries(evidence.definitions.map((d) => [d.key, d.name]));
  const evidenceSummaryLines = evidence.indicatorRows.slice(0, 3).map(
    (r) => `${defMap[r.indicator_key] ?? r.indicator_key}: ${r.state}`
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

  const config = forecast?.config as ForecastConfig | null;
  const activeScenarioKey = snapshot?.active_scenario as ScenarioKey | undefined;
  const align = (snapshot?.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {};

  return (
    <div className="space-y-6">
      <MissionBanner />
      <HowToRead defaultExpanded={shareMode} />
      {snapshot ? (
        <>
          {shareMode && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CopySummaryButton summaryText={copySummaryText} />
              <p className="text-xs text-zinc-500">Educational speculation. Not investment advice.</p>
            </div>
          )}
          {config && activeScenarioKey && (
            <DashboardNowNextWatch
              latestSnapshot={{
                week_ending: snapshot.week_ending,
                active_scenario: activeScenarioKey,
                confidence: snapshot.confidence,
                top_contributors: snapshot.top_contributors ?? [],
              }}
              forecastConfig={config}
              forecastVersion={forecastVersion}
              createdAt={forecast?.created_at ?? null}
              activeScenarioKey={activeScenarioKey}
              shareMode={shareMode}
              nerdMode={nerdMode}
            />
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardAlignmentTiles
              alignment={align}
              activeScenarioKey={activeScenarioKey ?? "base"}
              weekEnding={snapshot.week_ending}
            />
            <ScenarioProbChips
              scenarioProbs={(snapshot.scenario_probs as Record<ScenarioKey, number>) ?? {}}
              prevScenarioProbs={prevSnapshot ? (prevSnapshot.scenario_probs as Record<ScenarioKey, number>) : null}
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
        <p className="text-zinc-400">No weekly snapshot yet. Run the weekly cron or seed data.</p>
      )}
    </div>
  );
}
