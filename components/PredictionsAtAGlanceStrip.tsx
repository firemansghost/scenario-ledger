import Link from "next/link";
import { derivePeriodLabel } from "@/lib/periodLabels";
import { MiniSparkline } from "@/components/MiniSparkline";
import { TimeboxProgress } from "@/components/TimeboxProgress";
import { WhyThisScoreDrawer } from "@/components/WhyThisScoreDrawer";
import type { PathIntegrity } from "@/lib/pathIntegrity";
import type { PathIntegrityExplain } from "@/lib/pathIntegrityExplain";
import type { ScenarioKey } from "@/lib/types";

type AlignRow = { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } };

function getDriftValue(row: AlignRow | undefined, key: "btc" | "spy"): number | null {
  const cell = row?.[key];
  if (!cell) return null;
  if (cell.inBand) return 0;
  return cell.driftPct ?? null;
}

const gradeStyles: Record<PathIntegrity["grade"], string> = {
  A: "bg-emerald-900/50 text-emerald-300",
  B: "bg-emerald-800/40 text-emerald-200",
  C: "bg-amber-900/50 text-amber-300",
  D: "bg-rose-900/50 text-rose-300",
  F: "bg-rose-950/60 text-rose-400",
};

interface PredictionsAtAGlanceStripProps {
  currentPeriod: { start: string; end: string; label?: string } | null;
  activeScenario: ScenarioKey;
  snapshotsForSparkline: { alignment?: Record<string, AlignRow | undefined> }[];
  checkpointsCount: number;
  invalidationsCount: number;
  pathIntegrity?: PathIntegrity | null;
  pathIntegrityExplain?: PathIntegrityExplain | null;
  weekEnding?: string;
  shareMode?: boolean;
}

export function PredictionsAtAGlanceStrip({
  currentPeriod,
  activeScenario,
  snapshotsForSparkline,
  checkpointsCount,
  invalidationsCount,
  pathIntegrity,
  pathIntegrityExplain,
  weekEnding,
  shareMode = false,
}: PredictionsAtAGlanceStripProps) {
  const qs = shareMode ? "?share=1" : "";
  const btcSeries = snapshotsForSparkline
    .map((s) => getDriftValue(s.alignment?.[activeScenario] ?? s.alignment?.["base"], "btc"))
    .filter((v): v is number => v != null);
  const spySeries = snapshotsForSparkline
    .map((s) => getDriftValue(s.alignment?.[activeScenario] ?? s.alignment?.["base"], "spy"))
    .filter((v): v is number => v != null);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      {pathIntegrity && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="mb-2 text-xs font-medium text-zinc-500">Path integrity</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-zinc-200">{pathIntegrity.score}/100</span>
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${gradeStyles[pathIntegrity.grade]}`}>
              {pathIntegrity.grade}
            </span>
            <span className="text-xs text-zinc-500">{pathIntegrity.label}</span>
            {pathIntegrity.deltaWoW != null && (
              <span className={`text-xs ${pathIntegrity.deltaWoW >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {pathIntegrity.deltaWoW >= 0 ? "+" : ""}{pathIntegrity.deltaWoW.toFixed(1)} WoW
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Consistency with published bands (not a forecast).
          </p>
          {weekEnding && pathIntegrityExplain && (
            <WhyThisScoreDrawer
              explain={pathIntegrityExplain}
              integrity={pathIntegrity}
              shareMode={shareMode}
              weekEnding={weekEnding}
              canonicalUrl={`/briefs/${weekEnding}`}
              compact
            />
          )}
          {weekEnding && !pathIntegrityExplain && (
            <Link
              href={`/briefs/${weekEnding}${qs}`}
              className="mt-1 inline-block text-xs text-zinc-500 underline hover:text-zinc-300"
            >
              See full read →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
