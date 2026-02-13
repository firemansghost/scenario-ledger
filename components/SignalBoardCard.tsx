import Link from "next/link";
import { MiniSparkline } from "@/components/MiniSparkline";
import { WhyThisScoreDrawer } from "@/components/WhyThisScoreDrawer";
import type { PathIntegrity } from "@/lib/pathIntegrity";
import type { PathIntegrityExplain } from "@/lib/pathIntegrityExplain";

interface SignalBoardCardProps {
  integrity: PathIntegrity;
  shareMode: boolean;
  weekEnding: string;
  forecastVersion?: number;
  activeScenarioLabel: string;
  confidence?: string;
  btcStatus?: string;
  eqStatus?: string;
  integrityScoresForSparkline?: (number | null)[];
  explain?: PathIntegrityExplain | null;
  canonicalUrl?: string;
}

const gradeStyles: Record<PathIntegrity["grade"], string> = {
  A: "bg-emerald-900/50 text-emerald-300",
  B: "bg-emerald-800/40 text-emerald-200",
  C: "bg-amber-900/50 text-amber-300",
  D: "bg-rose-900/50 text-rose-300",
  F: "bg-rose-950/60 text-rose-400",
};

export function SignalBoardCard({
  integrity,
  shareMode,
  weekEnding,
  forecastVersion,
  activeScenarioLabel,
  confidence = "—",
  btcStatus = "—",
  eqStatus = "—",
  integrityScoresForSparkline = [],
  explain,
  canonicalUrl,
}: SignalBoardCardProps) {
  const qs = shareMode ? "?share=1" : "";
  const briefHref = `/briefs/${weekEnding}${qs}`;
  const predictionsHref = `/predictions${qs}`;
  const alignmentHref = `/alignment${qs}`;

  const sparklineValues =
    integrityScoresForSparkline.length > 0
      ? integrityScoresForSparkline
      : [integrity.score];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-3 text-lg font-medium">Signal board</h2>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-2xl font-semibold text-zinc-100">
          {integrity.score}/100
        </span>
        <span
          className={`rounded px-2 py-0.5 text-sm font-medium ${gradeStyles[integrity.grade]}`}
        >
          {integrity.grade}
        </span>
        <span className="text-sm text-zinc-400">{integrity.label}</span>
        {integrity.deltaWoW != null && (
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              integrity.deltaWoW >= 0 ? "bg-emerald-900/40 text-emerald-300" : "bg-rose-900/40 text-rose-300"
            }`}
          >
            {integrity.deltaWoW >= 0 ? "+" : ""}
            {integrity.deltaWoW.toFixed(1)} WoW
          </span>
        )}
        {integrity.deltaWoW == null && (
          <span className="rounded bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-500">
            — WoW
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-zinc-700/50 px-2 py-1 text-zinc-400">
          Read: {activeScenarioLabel} · {confidence}
        </span>
        <span className="rounded bg-zinc-700/50 px-2 py-1 text-zinc-400">
          BTC: {btcStatus}
        </span>
        <span className="rounded bg-zinc-700/50 px-2 py-1 text-zinc-400">
          Equity: {eqStatus}
        </span>
      </div>

      {integrity.notes.length > 0 && (
        <ul className="mb-4 list-disc space-y-0.5 pl-4 text-sm text-zinc-400">
          {integrity.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}

      {sparklineValues.length >= 2 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-zinc-500">Integrity (8w)</span>
          <MiniSparkline
            values={sparklineValues}
            width={120}
            height={24}
            strokeClassName="stroke-amber-400/80"
          />
        </div>
      )}

      <p className="mb-4 text-xs text-zinc-500">
        This score measures consistency with the published bands + evidence. It does not predict price.
      </p>

      {explain && canonicalUrl && (
        <WhyThisScoreDrawer
          explain={explain}
          integrity={integrity}
          shareMode={shareMode}
          weekEnding={weekEnding}
          canonicalUrl={canonicalUrl}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={briefHref}
          className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
          Open this week&apos;s brief
        </Link>
        <Link
          href={predictionsHref}
          className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
        >
          Forecast brief
        </Link>
        <Link
          href={alignmentHref}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          Alignment →
        </Link>
      </div>
    </div>
  );
}
