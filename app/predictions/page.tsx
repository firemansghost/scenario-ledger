import { createClient } from "@/lib/supabaseClient";
import { MissionBanner } from "@/components/MissionBanner";
import { ForecastAtAGlance } from "@/components/ForecastAtAGlance";
import { ThisWeekVsForecast } from "@/components/ThisWeekVsForecast";
import type { ForecastConfig } from "@/lib/types";

export const revalidate = 60;

export default async function PredictionsPage() {
  const supabase = createClient();
  const { data: forecast } = await supabase
    .from("forecasts")
    .select("id, version, name, config")
    .eq("is_active", true)
    .maybeSingle();

  const { data: snapshot } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, alignment, btc_close, spy_close, spx_equiv")
    .order("week_ending", { ascending: false })
    .limit(1)
    .maybeSingle();

  const config = forecast?.config as ForecastConfig | null;
  const factor = config?.meta?.spxToSpyFactor ?? 0.1;

  return (
    <div className="space-y-6">
      <MissionBanner />
      <h1 className="text-xl font-semibold">Predictions</h1>
      <p className="text-sm text-zinc-400">
        What we published: active forecast and how this week lines up.
      </p>
      {config ? (
        <>
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-medium">Forecast at a glance</h2>
            <ForecastAtAGlance
              config={config}
              forecastName={forecast?.name ?? undefined}
              version={forecast?.version ?? undefined}
            />
          </section>
          {snapshot && (
            <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <ThisWeekVsForecast snapshot={snapshot} factor={factor} />
            </section>
          )}
        </>
      ) : (
        <p className="text-zinc-500">No active forecast. Run seed or set one active.</p>
      )}
    </div>
  );
}
