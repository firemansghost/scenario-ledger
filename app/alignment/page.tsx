import { createClient } from "@/lib/supabaseClient";
import { AlignmentChart } from "@/components/alignment-chart";
import { MissionBanner } from "@/components/MissionBanner";

export const revalidate = 60;

export default async function AlignmentPage() {
  const supabase = createClient();
  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, alignment, spx_equiv, spy_close, btc_close")
    .order("week_ending", { ascending: true });

  const { data: forecast } = await supabase
    .from("forecasts")
    .select("config")
    .eq("is_active", true)
    .single();

  const config = forecast?.config as { meta?: { spxToSpyFactor?: number } } | null;
  const factor = config?.meta?.spxToSpyFactor ?? 0.1;

  return (
    <div className="space-y-6">
      <MissionBanner />
      <h1 className="text-xl font-semibold">Alignment</h1>
      <p className="text-sm text-zinc-400">
        BTC/SPY vs forecast bands by scenario. Drift = % outside band. SPX band + SPX-equiv close + SPY actual.
      </p>
      {snapshots && snapshots.length > 0 ? (
        <>
          <AlignmentChart snapshots={snapshots} factor={factor} />
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-2 text-lg font-medium">Latest week</h2>
            {(() => {
              const latest = snapshots[snapshots.length - 1];
              const align = latest?.alignment as Record<string, { btc?: { inBand: boolean }; spy?: { inBand: boolean }; periodLabel?: string }> | undefined;
              return (
                <dl className="grid gap-2 text-sm">
                  {align &&
                    ["bull", "base", "bear"].map((sc) => (
                      <div key={sc}>
                        <dt className="capitalize text-zinc-400">{sc}</dt>
                        <dd>
                          BTC {align[sc]?.btc?.inBand ? "✓ in band" : "✗ out"} · SPY{" "}
                          {align[sc]?.spy?.inBand ? "✓ in band" : "✗ out"}
                          {align[sc]?.periodLabel && ` (${align[sc].periodLabel})`}
                        </dd>
                      </div>
                    ))}
                  <div>
                    <dt className="text-zinc-400">SPX equiv / SPY / factor</dt>
                    <dd className="font-mono">
                      {latest?.spx_equiv != null ? Number(latest.spx_equiv).toFixed(2) : "—"} /{" "}
                      {latest?.spy_close != null ? Number(latest.spy_close).toFixed(2) : "—"} / {factor}
                    </dd>
                  </div>
                </dl>
              );
            })()}
          </section>
        </>
      ) : (
        <p className="text-zinc-400">No snapshots yet. Run the weekly cron.</p>
      )}
    </div>
  );
}
