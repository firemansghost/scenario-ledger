import { AlignmentPendingNote } from "@/components/AlignmentPendingNote";
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
  lastComputedWeekEnding?: string | null;
  nerdMode?: boolean;
}

function DriftCell({
  inBand,
  driftPct,
  hasCell,
}: {
  inBand: boolean;
  driftPct?: number;
  hasCell: boolean;
}) {
  if (inBand) return <span className="text-emerald-400">In band (0.0%)</span>;
  if (driftPct != null) {
    const sign = driftPct >= 0 ? "+" : "";
    return <span className="text-amber-400">Out ({sign}{driftPct.toFixed(1)}%)</span>;
  }
  const isPending = !hasCell || (!inBand && driftPct == null);
  return <span className="text-zinc-500">—</span>;
}

function hasComputedDrift(cell: AlignRow["btc"] | AlignRow["spy"]): boolean {
  if (!cell) return false;
  if (cell.inBand) return true;
  return cell.driftPct != null;
}

export function ThisWeekVsForecast({
  snapshot,
  factor,
  lastComputedWeekEnding,
  nerdMode = false,
}: ThisWeekVsForecastProps) {
  const align: Record<ScenarioKey, AlignRow> = snapshot.alignment ?? ({} as Record<ScenarioKey, AlignRow>);
  const scenarios: { key: ScenarioKey; label: string }[] = [
    { key: "bull", label: "Bull" },
    { key: "base", label: "Base" },
    { key: "bear", label: "Bear" },
  ];

  const baseAlign = align.base ?? align["base"];
  const hasAnyComputed =
    hasComputedDrift(baseAlign?.btc) || hasComputedDrift(baseAlign?.spy) ||
    scenarios.some(({ key }) => hasComputedDrift(align[key]?.btc) || hasComputedDrift(align[key]?.spy));
  const isSectionPending = !hasAnyComputed;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">This week vs forecast</h2>
      <p className="text-sm text-zinc-500">In/Out is vs the published band for that timebox.</p>
      <p className="text-xs text-zinc-500">Week ending {snapshot.week_ending}</p>
      {isSectionPending && (
        <AlignmentPendingNote
          lastComputedWeekEnding={lastComputedWeekEnding ?? undefined}
          nerdMode={nerdMode}
        />
      )}
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900/50">
              <th className="p-2 font-medium">Scenario</th>
              <th className="p-2 font-medium">BTC vs band</th>
              <th className="p-2 font-medium">Equity vs band</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(({ key, label }) => {
              const a = align[key];
              return (
                <tr key={key} className="border-b border-zinc-800">
                  <td className="p-2 font-medium capitalize">{label}</td>
                  <td className="p-2">
                    <DriftCell
                      inBand={a?.btc?.inBand ?? false}
                      driftPct={a?.btc?.driftPct}
                      hasCell={a?.btc != null}
                    />
                  </td>
                  <td className="p-2">
                    <DriftCell
                      inBand={a?.spy?.inBand ?? false}
                      driftPct={a?.spy?.driftPct}
                      hasCell={a?.spy != null}
                    />
                  </td>
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
