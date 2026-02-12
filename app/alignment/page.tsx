import { createClient } from "@/lib/supabaseClient";
import { DEFAULT_SPX_FACTOR } from "@/lib/equityProxy";
import { AlignmentChart } from "@/components/alignment-chart";
import { AlignmentNerdExtra } from "@/components/AlignmentNerdExtra";
type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
  periodLabel?: string;
};

export const revalidate = 60;

export default async function AlignmentPage() {
  const supabase = createClient();
  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, alignment, spx_equiv, spy_close, btc_close, spx_factor")
    .order("week_ending", { ascending: true });

  const latest = snapshots?.length ? snapshots[snapshots.length - 1] : null;
  const factorFromSnapshot = latest?.spx_factor ?? null;
  const factor = factorFromSnapshot ?? DEFAULT_SPX_FACTOR;
  const factorIsFallback = factorFromSnapshot == null;

  const align = (latest?.alignment as Record<string, AlignRow> | undefined) ?? {};
  const last8 = (snapshots ?? []).slice(-8).reverse();

  const driftDisplay = (d: number | undefined, inBand: boolean) => {
    if (inBand) return "0.0%";
    if (d != null) return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
    return "—";
  };

  const statusBadge = (inBand: boolean) =>
    inBand ? <span className="text-emerald-400">In</span> : <span className="text-amber-400">Out</span>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Alignment</h1>
      <p className="text-sm text-zinc-400">
        Alignment asks one question: is price behaving like the scenario says it should?
      </p>
      <p className="text-sm text-zinc-400">
        We compare weekly closes to the published bands. Drift is the % outside the nearest edge — and it&apos;s{" "}
        <span className="font-medium text-zinc-200">0%</span> when you&apos;re in-band.
      </p>
      <p className="text-xs text-zinc-500">
        Equity bands are defined in SPX points. We score equity alignment using SPY closes by converting bands with that week&apos;s SPY/SPX factor.
      </p>
      {snapshots && snapshots.length > 0 ? (
        <>
          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-lg font-medium">Latest week</h2>
            <p className="mb-1 text-sm text-zinc-500">
              Week ending: <span className="font-mono text-zinc-300">{latest?.week_ending ?? "—"}</span>
            </p>
            <p className="mb-3 text-xs text-zinc-600">
              Factor: <span className="font-mono">{factor.toFixed(4)}</span>
              {factorIsFallback ? " (default — SPX missing this week)" : " (derived from SPY/SPX closes)"}
            </p>
            <p className="mb-3 text-sm text-zinc-500">Drift = % outside band (0 when in-band).</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {(["bull", "base", "bear"] as const).map((sc) => {
                const a = align[sc];
                const btcIn = a?.btc?.inBand ?? false;
                const spyIn = a?.spy?.inBand ?? false;
                const btcDrift = a?.btc?.driftPct;
                const spyDrift = a?.spy?.driftPct;
                return (
                  <div key={sc} className="rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                    <span className="font-medium capitalize text-zinc-300">{sc}</span>
                    <span className="ml-2 text-zinc-500">
                      BTC: {btcIn ? <span className="text-emerald-400">In</span> : <span className="text-amber-400">Out</span>}
                      {` ${driftDisplay(btcDrift, btcIn)}`}
                    </span>
                    <span className="ml-2 text-zinc-500">
                      Equity: {spyIn ? <span className="text-emerald-400">In</span> : <span className="text-amber-400">Out</span>}
                      {` ${driftDisplay(spyDrift, spyIn)}`}
                    </span>
                    {a?.periodLabel && <span className="ml-1 text-zinc-500">({a.periodLabel})</span>}
                  </div>
                );
              })}
            </div>
            <dl className="grid gap-2 text-sm">
              {latest?.btc_close != null && (
                <div>
                  <dt className="text-zinc-400">BTC close</dt>
                  <dd className="font-mono">${Number(latest.btc_close).toLocaleString()}</dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-400">SPY close</dt>
                <dd className="font-mono">{latest?.spy_close != null ? Number(latest.spy_close).toFixed(2) : "—"}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <AlignmentNerdExtra
                spxEquiv={latest?.spx_equiv ?? null}
                spyClose={latest?.spy_close ?? null}
                factor={factor}
              />
            </div>
          </section>

          <AlignmentChart snapshots={snapshots} factor={factor} />

          <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="mb-3 text-lg font-medium">Last 8 weeks</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-700 bg-zinc-900/50">
                    <th className="p-2 font-medium">Week ending</th>
                    <th className="p-2 font-medium">BTC drift (Base)</th>
                    <th className="p-2 font-medium">Equity drift (Base)</th>
                    <th className="p-2 font-medium">BTC</th>
                    <th className="p-2 font-medium">Equity</th>
                  </tr>
                </thead>
                <tbody>
                  {last8.map((s) => {
                    const a = (s.alignment as Record<string, AlignRow> | undefined) ?? {};
                    const base = a.base;
                    const btcIn = base?.btc?.inBand ?? false;
                    const spyIn = base?.spy?.inBand ?? false;
                    const btcDrift = base?.btc?.driftPct;
                    const spyDrift = base?.spy?.driftPct;
                    return (
                      <tr key={s.week_ending} className="border-b border-zinc-800">
                        <td className="p-2 font-medium">{s.week_ending}</td>
                        <td className="p-2 font-mono">{driftDisplay(btcDrift, btcIn)}</td>
                        <td className="p-2 font-mono">{driftDisplay(spyDrift, spyIn)}</td>
                        <td className="p-2">{statusBadge(btcIn)}</td>
                        <td className="p-2">{statusBadge(spyIn)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p className="text-zinc-400">No snapshots yet. Run the weekly cron.</p>
      )}
    </div>
  );
}
