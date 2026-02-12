import Link from "next/link";
import { MiniSparkline } from "@/components/MiniSparkline";
import type { ScenarioKey } from "@/lib/types";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

type SnapshotForSparkline = {
  alignment?: Record<string, AlignRow | undefined>;
};

interface DashboardAlignmentTilesProps {
  alignment: Record<string, AlignRow | undefined>;
  activeScenarioKey: ScenarioKey;
  weekEnding: string;
  /** Last 8 snapshots (oldest first) for sparklines */
  snapshotsForSparkline?: SnapshotForSparkline[];
  nerdMode?: boolean;
}

function DriftDisplay({
  inBand,
  driftPct,
  isPending,
  nerdMode,
}: {
  inBand: boolean;
  driftPct?: number;
  isPending: boolean;
  nerdMode?: boolean;
}) {
  if (inBand) return <span className="text-emerald-400">In (0.0%)</span>;
  if (driftPct != null) {
    const sign = driftPct >= 0 ? "+" : "";
    return <span className="text-amber-400">Out ({sign}{driftPct.toFixed(1)}%)</span>;
  }
  if (isPending) {
    return (
      <span>
        <span className="text-zinc-500">Alignment pending</span>
        <span className="block text-xs text-zinc-600">
          Waiting for weekly run / drift compute.
          {nerdMode && " Run weekly pipeline / check runs page."}
        </span>
      </span>
    );
  }
  return <span className="text-zinc-500">—</span>;
}

function getDriftValue(row: AlignRow | undefined, key: "btc" | "spy"): number | null {
  const cell = row?.[key];
  if (!cell) return null;
  if (cell.inBand) return 0;
  return cell.driftPct ?? null;
}

export function DashboardAlignmentTiles({
  alignment,
  activeScenarioKey,
  weekEnding,
  snapshotsForSparkline = [],
  nerdMode = false,
}: DashboardAlignmentTilesProps) {
  const activeAlign = alignment[activeScenarioKey] ?? alignment["base"];
  const btcCell = activeAlign?.btc;
  const spyCell = activeAlign?.spy;
  const btcIn = btcCell?.inBand ?? false;
  const spyIn = spyCell?.inBand ?? false;
  const btcPending = !btcCell || (!btcIn && btcCell.driftPct == null);
  const spyPending = !spyCell || (!spyIn && spyCell.driftPct == null);

  const btcDriftSeries = snapshotsForSparkline
    .map((s) => getDriftValue(s.alignment?.[activeScenarioKey] ?? s.alignment?.["base"], "btc"))
    .filter((v): v is number => v != null);
  const spyDriftSeries = snapshotsForSparkline
    .map((s) => getDriftValue(s.alignment?.[activeScenarioKey] ?? s.alignment?.["base"], "spy"))
    .filter((v): v is number => v != null);

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
          <DriftDisplay
            inBand={btcIn}
            driftPct={activeAlign?.btc?.driftPct}
            isPending={btcPending}
            nerdMode={nerdMode}
          />
          {btcDriftSeries.length >= 2 && (
            <div className="mt-2">
              <MiniSparkline values={btcDriftSeries} width={60} height={16} strokeClassName="stroke-amber-400/80" />
            </div>
          )}
        </Link>
        <Link
          href="/alignment"
          className="rounded border border-zinc-700 p-3 hover:border-zinc-600"
        >
          <p className="mb-1 text-xs font-medium text-zinc-400">Equity</p>
          <DriftDisplay
            inBand={spyIn}
            driftPct={activeAlign?.spy?.driftPct}
            isPending={spyPending}
            nerdMode={nerdMode}
          />
          {spyDriftSeries.length >= 2 && (
            <div className="mt-2">
              <MiniSparkline values={spyDriftSeries} width={60} height={16} strokeClassName="stroke-amber-400/80" />
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}
