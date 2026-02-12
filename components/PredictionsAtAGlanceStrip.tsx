import Link from "next/link";
import { derivePeriodLabel } from "@/lib/periodLabels";
import { MiniSparkline } from "@/components/MiniSparkline";
import { TimeboxProgress } from "@/components/TimeboxProgress";
import type { ScenarioKey } from "@/lib/types";

type AlignRow = { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } };

function getDriftValue(row: AlignRow | undefined, key: "btc" | "spy"): number | null {
  const cell = row?.[key];
  if (!cell) return null;
  if (cell.inBand) return 0;
  return cell.driftPct ?? null;
}

interface PredictionsAtAGlanceStripProps {
  currentPeriod: { start: string; end: string; label?: string } | null;
  activeScenario: ScenarioKey;
  snapshotsForSparkline: { alignment?: Record<string, AlignRow | undefined> }[];
  checkpointsCount: number;
  invalidationsCount: number;
}

export function PredictionsAtAGlanceStrip({
  currentPeriod,
  activeScenario,
  snapshotsForSparkline,
  checkpointsCount,
  invalidationsCount,
}: PredictionsAtAGlanceStripProps) {
  const btcSeries = snapshotsForSparkline
    .map((s) => getDriftValue(s.alignment?.[activeScenario] ?? s.alignment?.["base"], "btc"))
    .filter((v): v is number => v != null);
  const spySeries = snapshotsForSparkline
    .map((s) => getDriftValue(s.alignment?.[activeScenario] ?? s.alignment?.["base"], "spy"))
    .filter((v): v is number => v != null);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-500">Current timebox</p>
        {currentPeriod ? (
          <>
            <p className="font-medium text-zinc-200">
              {derivePeriodLabel(currentPeriod.start, currentPeriod.end, currentPeriod.label)}
            </p>
            <TimeboxProgress start={currentPeriod.start} end={currentPeriod.end} now={new Date()} />
          </>
        ) : (
          <p className="text-zinc-500">—</p>
        )}
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-500">Alignment (8 weeks)</p>
        <div className="flex gap-4">
          <div>
            <p className="mb-0.5 text-xs text-zinc-500">BTC</p>
            {btcSeries.length >= 2 ? (
              <MiniSparkline values={btcSeries} width={70} height={18} strokeClassName="stroke-amber-400/80" />
            ) : (
              <span className="text-xs text-zinc-500">—</span>
            )}
          </div>
          <div>
            <p className="mb-0.5 text-xs text-zinc-500">Equity</p>
            {spySeries.length >= 2 ? (
              <MiniSparkline values={spySeries} width={70} height={18} strokeClassName="stroke-amber-400/80" />
            ) : (
              <span className="text-xs text-zinc-500">—</span>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-500">Tripwires</p>
        <p className="text-sm text-zinc-300">
          {checkpointsCount} checkpoints / {invalidationsCount} invalidations
        </p>
        <Link href="#tripwires" className="mt-1 inline-block text-xs text-zinc-500 underline hover:text-zinc-300">
          See full checklist
        </Link>
      </div>
    </div>
  );
}
