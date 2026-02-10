import type { ScenarioKey } from "@/lib/types";

type AlignRow = { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number }; periodLabel?: string };
interface SnapshotRow {
  week_ending: string;
  btc_close?: number | null;
  spy_close?: number | null;
  spx_equiv?: number | null;
  alignment?: Record<ScenarioKey, AlignRow>;
}

interface ThisWeekVsForecastProps {
  snapshot: SnapshotRow;
  factor: number;
}

function DriftCell({ inBand, driftPct }: { inBand: boolean; driftPct?: number }) {
  if (inBand) return <span className="text-emerald-400">In band</span>;
  const pct = driftPct != null ? driftPct.toFixed(1) : "—";
  return <span className="text-amber-400">Out ({pct}% drift)</span>;
}

export function ThisWeekVsForecast({ snapshot, factor }: ThisWeekVsForecastProps) {
  const align: Record<ScenarioKey, AlignRow> = snapshot.alignment ?? ({} as Record<ScenarioKey, AlignRow>);
  const scenarios: { key: ScenarioKey; label: string }[] = [
    { key: "bull", label: "Bull" },
    { key: "base", label: "Base" },
    { key: "bear", label: "Bear" },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">This week vs forecast</h2>
      <p className="text-sm text-zinc-500">Week ending {snapshot.week_ending}</p>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900/50">
              <th className="p-2 font-medium">Scenario</th>
              <th className="p-2 font-medium">BTC close</th>
              <th className="p-2 font-medium">SPY close</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(({ key, label }) => {
              const a = align[key];
              return (
                <tr key={key} className="border-b border-zinc-800">
                  <td className="p-2 font-medium capitalize">{label}</td>
                  <td className="p-2"><DriftCell inBand={a?.btc?.inBand ?? false} driftPct={a?.btc?.driftPct} /></td>
                  <td className="p-2"><DriftCell inBand={a?.spy?.inBand ?? false} driftPct={a?.spy?.driftPct} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {snapshot.btc_close != null && <p className="text-xs text-zinc-500">BTC close: ${Number(snapshot.btc_close).toLocaleString()}</p>}
      {snapshot.spy_close != null && snapshot.spx_equiv != null && (
        <p className="text-xs text-zinc-500">SPY: {Number(snapshot.spy_close).toFixed(2)} · SPX equiv (×{factor}): {Number(snapshot.spx_equiv).toFixed(2)}</p>
      )}
    </div>
  );
}
