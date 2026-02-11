import Link from "next/link";
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
    .select("id, version, name, config, created_at")
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
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <p className="mb-2 text-sm text-zinc-300">This forecast is based on a simple cycle + macro regime framework. Details:</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li><Link href="/learn/btc-cycle" className="text-zinc-400 underline hover:text-white">Bitcoin 4-Year Cycle (Days & Phases)</Link></li>
          <li><Link href="/learn/equity-cycle" className="text-zinc-400 underline hover:text-white">Equity 4-Year Cycle (Presidential Cycle on SPY)</Link></li>
          <li><Link href="/learn/scoring" className="text-zinc-400 underline hover:text-white">How scoring works</Link></li>
        </ul>
      </section>
      {forecast && (forecast.created_at != null || forecast.version != null) && (
        <p className="text-xs text-zinc-500">
          Published as-of: v{forecast.version ?? "—"}
          {forecast.created_at != null && ` · ${new Date(forecast.created_at).toLocaleDateString()}`}
        </p>
      )}
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
