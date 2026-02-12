import Link from "next/link";
import type { ScenarioKey } from "@/lib/types";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

interface DashboardAlignmentTilesProps {
  alignment: Record<string, AlignRow | undefined>;
  activeScenarioKey: ScenarioKey;
  weekEnding: string;
}

function DriftDisplay({ inBand, driftPct }: { inBand: boolean; driftPct?: number }) {
  if (inBand) return <span className="text-emerald-400">In (0.0%)</span>;
  if (driftPct != null) {
    const sign = driftPct >= 0 ? "+" : "";
    return <span className="text-amber-400">Out ({sign}{driftPct.toFixed(1)}%)</span>;
  }
  return <span className="text-zinc-500">—</span>;
}

export function DashboardAlignmentTiles({
  alignment,
  activeScenarioKey,
  weekEnding,
}: DashboardAlignmentTilesProps) {
  const activeAlign = alignment[activeScenarioKey];
  const btcIn = activeAlign?.btc?.inBand ?? false;
  const spyIn = activeAlign?.spy?.inBand ?? false;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">Alignment</h2>
      <p className="mb-3 text-sm text-zinc-500">
        Drift is % outside the nearest edge (0% when in-band).
      </p>
      <p className="mb-3 text-xs text-zinc-500">Week ending {weekEnding}</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Link
          href="/alignment"
          className="rounded border border-zinc-700 p-3 hover:border-zinc-600"
        >
          <p className="mb-1 text-xs font-medium text-zinc-400">BTC</p>
          <DriftDisplay inBand={btcIn} driftPct={activeAlign?.btc?.driftPct} />
        </Link>
        <Link
          href="/alignment"
          className="rounded border border-zinc-700 p-3 hover:border-zinc-600"
        >
          <p className="mb-1 text-xs font-medium text-zinc-400">Equity</p>
          <DriftDisplay inBand={spyIn} driftPct={activeAlign?.spy?.driftPct} />
        </Link>
      </div>
    </div>
  );
}
