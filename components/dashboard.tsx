import { createClient } from "@/lib/supabaseClient";
import { DataStatusBadge } from "@/components/data-status-badge";
import { ProbabilityBar } from "@/components/probability-bar";
import { ScenarioCard } from "@/components/scenario-card";

export async function Dashboard() {
  const supabase = createClient();
  const { data: snapshot } = await supabase
    .from("weekly_snapshots")
    .select("*")
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: forecast } = snapshot
    ? await supabase.from("forecasts").select("config").eq("id", snapshot.forecast_id).single()
    : { data: null };

  const spxFactor = (forecast?.config as { meta?: { spxToSpyFactor?: number } })?.meta?.spxToSpyFactor ?? 0.1;

  return (
    <div className="space-y-6">
      {snapshot ? (
        <>
          <ScenarioCard
            activeScenario={snapshot.active_scenario}
            confidence={snapshot.confidence}
            topContributors={snapshot.top_contributors ?? []}
          />
          <ProbabilityBar
            probs={snapshot.scenario_probs as Record<string, number>}
            active={snapshot.active_scenario}
          />
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
        </>
      ) : (
        <p className="text-zinc-400">No weekly snapshot yet. Run the weekly cron or seed data.</p>
      )}
    </div>
  );
}
