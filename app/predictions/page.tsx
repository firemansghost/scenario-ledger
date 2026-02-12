import { createClient } from "@/lib/supabaseClient";
import { ForecastAtAGlance } from "@/components/ForecastAtAGlance";
import { NearTermMap } from "@/components/NearTermMap";
import { PredictionsAtAGlanceStrip } from "@/components/PredictionsAtAGlanceStrip";
import { PublishedForecastSummary } from "@/components/PublishedForecastSummary";
import { ScenarioComparisonGrid } from "@/components/ScenarioComparisonGrid";
import { ThisWeekVsForecast } from "@/components/ThisWeekVsForecast";
import { TripwiresSection } from "@/components/TripwiresSection";
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

export default async function PredictionsPage() {
  const supabase = createClient();
  const { data: forecast } = await supabase
    .from("forecasts")
    .select("id, version, name, config, created_at")
    .eq("is_active", true)
    .maybeSingle();

  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, alignment, btc_close, spy_close, spx_equiv, spx_factor, active_scenario")
    .order("week_ending", { ascending: false })
    .limit(8);

  const snapshot = snapshots?.[0] ?? null;
  const snapshotsForSparkline = (snapshots ?? []).slice(0, 8).reverse();

  const config = forecast?.config as ForecastConfig | null;
  const factor = snapshot?.spx_factor ?? config?.meta?.spxToSpyFactor ?? 0.1;

  const activeScenario = (snapshot?.active_scenario as ScenarioKey) ?? "base";
  const periods = config?.scenarios?.[activeScenario]?.periods ?? [];
  const currentPeriodIndex = findCurrentPeriodIndex(periods, snapshot?.week_ending ?? "");
  const scenario = config?.scenarios?.[activeScenario];
  const checkpoints = scenario?.checkpoints ?? [];
  const invalidations = scenario?.invalidations ?? [];
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
          />
          {snapshot && (
            <section id="this-week" className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <ThisWeekVsForecast snapshot={snapshot} factor={factor} />
            </section>
          )}
          <section id="timeboxes" className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-medium">Forecast at a glance</h2>
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
