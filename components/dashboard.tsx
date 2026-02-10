import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { createServiceRoleClient } from "@/lib/supabaseServer";
import { getDataHealth } from "@/lib/dataHealth";
import { getEvidenceForWeek } from "@/lib/getEvidenceForWeek";
import { CopySummaryButton } from "@/components/CopySummaryButton";
import { DataHealthCard } from "@/components/DataHealthCard";
import { DataStatusBadge } from "@/components/data-status-badge";
import { HowToRead } from "@/components/HowToRead";
import { MissionBanner } from "@/components/MissionBanner";
import { ProbabilityBar } from "@/components/probability-bar";
import { ReceiptsPanel } from "@/components/ReceiptsPanel";
import { ScenarioCard } from "@/components/scenario-card";

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

  const { data: snapshot } = await supabase
    .from("weekly_snapshots")
    .select("*")
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [dataHealth, evidence] = await Promise.all([
    getDataHealth(supabaseService),
    snapshot
      ? getEvidenceForWeek(supabase, String(snapshot.week_ending))
      : Promise.resolve({ indicatorRows: [], definitions: [] }),
  ]);

  const { data: forecast } = snapshot
    ? await supabase.from("forecasts").select("config, version").eq("id", snapshot.forecast_id).single()
    : { data: null };

  const spxFactor = (forecast?.config as { meta?: { spxToSpyFactor?: number } })?.meta?.spxToSpyFactor ?? 0.1;
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

  return (
    <div className="space-y-6">
      <MissionBanner />
      <HowToRead defaultExpanded={shareMode} />
      {nerdMode && !shareMode && <DataHealthCard data={dataHealth} />}
      {snapshot ? (
        <>
          {shareMode && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CopySummaryButton summaryText={copySummaryText} />
              <p className="text-xs text-zinc-500">Educational speculation. Not investment advice.</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {forecastVersion != null && (
              <p className="text-xs text-zinc-500">
                Forecast version used: v{forecastVersion}. Forecasts are immutable; updates ship as new versions.
              </p>
            )}
            <Link
              href={shareMode ? "/predictions?share=1" : "/predictions"}
              className="inline-flex rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white"
            >
              View Published Forecast
            </Link>
          </div>
          <ScenarioCard
            activeScenario={snapshot.active_scenario}
            confidence={snapshot.confidence}
            topContributors={snapshot.top_contributors ?? []}
          />
          <ProbabilityBar
            probs={snapshot.scenario_probs as Record<string, number>}
            active={snapshot.active_scenario}
          />
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
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-2 text-lg font-medium">Latest weekly closes</h2>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-zinc-400">BTC</dt>
                <dd className="font-mono">
                  {snapshot.btc_close != null ? `$${Number(snapshot.btc_close).toLocaleString()}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">SPX (equiv)</dt>
                <dd className="font-mono">
                  {snapshot.spx_equiv != null ? Number(snapshot.spx_equiv).toFixed(2) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">SPY actual</dt>
                <dd className="font-mono">
                  {snapshot.spy_close != null ? Number(snapshot.spy_close).toFixed(2) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-400">Factor (spxToSpy)</dt>
                <dd className="font-mono">{spxFactor}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-500">Week ending {snapshot.week_ending}</p>
          </section>
          <DataStatusBadge
            dataCompleteness={snapshot.data_completeness}
            weekEnding={snapshot.week_ending}
          />
          {nerdMode && !shareMode && (
            <ReceiptsPanel
              weekEnding={String(snapshot.week_ending)}
              indicatorRows={evidence.indicatorRows}
              definitions={evidence.definitions}
              initialOpen
            />
          )}
          {nerdMode && !shareMode && copySummaryText && (
            <div className="flex items-center gap-2">
              <CopySummaryButton summaryText={copySummaryText} />
            </div>
          )}
        </>
      ) : (
        <p className="text-zinc-400">No weekly snapshot yet. Run the weekly cron or seed data.</p>
      )}
    </div>
  );
}
