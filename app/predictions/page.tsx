import { createClient } from "@/lib/supabaseClient";
import { MissionBanner } from "@/components/MissionBanner";
import { ForecastAtAGlance } from "@/components/ForecastAtAGlance";
import { PublishedForecastSummary } from "@/components/PublishedForecastSummary";
import { ScenarioComparisonGrid } from "@/components/ScenarioComparisonGrid";
import { ThisWeekVsForecast } from "@/components/ThisWeekVsForecast";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

export const revalidate = 60;

export default async function PredictionsPage() {
  const supabase = createClient();
  const { data: forecast } = await supabase
    .from("forecasts")
    .select("id, version, name, config, created_at")
    .eq("is_active", true)
    .maybeSingle();

  const { data: snapshot } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, alignment, btc_close, spy_close, spx_equiv, active_scenario")
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  const config = forecast?.config as ForecastConfig | null;
  const factor = config?.meta?.spxToSpyFactor ?? 0.1;

  const activeScenario = (snapshot?.active_scenario as ScenarioKey) ?? "base";

  return (
    <div className="space-y-6">
      <MissionBanner />
      <h1 className="text-xl font-semibold">Predictions</h1>
      <p className="text-sm text-zinc-400">
        What we published: active forecast and how this week lines up.
      </p>
      {config ? (
        <>
          <PublishedForecastSummary
            config={config}
            version={forecast?.version ?? undefined}
            createdAt={forecast?.created_at ?? null}
            activeScenario={activeScenario}
          />
          {snapshot && (
            <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <ThisWeekVsForecast snapshot={snapshot} factor={factor} />
            </section>
          )}
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-medium">Forecast at a glance</h2>
            <ForecastAtAGlance
              config={config}
              forecastName={forecast?.name ?? undefined}
              version={forecast?.version ?? undefined}
            />
            <div className="mt-6">
              <ScenarioComparisonGrid config={config} />
            </div>
          </section>
        </>
      ) : (
        <p className="text-zinc-500">No active forecast. Run seed or set one active.</p>
      )}
    </div>
  );
}
