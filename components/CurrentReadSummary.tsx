import Link from "next/link";
import type { ScenarioKey } from "@/lib/types";

interface CurrentReadSummaryProps {
  forecastVersion?: number | null;
  forecastCreatedAt?: string | null;
  activeScenarioKey?: ScenarioKey;
  activeScenarioLabel?: string | null;
  firstPeriod?: {
    btcRangeUsd: { low: number; high: number };
    spxRange: { low: number; high: number };
  } | null;
  shareMode: boolean;
}

export function CurrentReadSummary({
  forecastVersion,
  forecastCreatedAt,
  activeScenarioLabel,
  firstPeriod,
  shareMode,
}: CurrentReadSummaryProps) {
  const predictionsHref = shareMode ? "/predictions?share=1" : "/predictions";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">Current read</h2>
      <p className="mb-3 text-sm text-zinc-500">Best fit to the latest evidence. Not destiny.</p>
      {(forecastVersion != null || forecastCreatedAt != null) && (
        <p className="mb-2 text-sm text-zinc-400">
          Pinned: v{forecastVersion ?? "—"}
          {forecastCreatedAt != null && ` · ${new Date(forecastCreatedAt).toLocaleDateString()}`}
        </p>
      )}
      {activeScenarioLabel && (
        <p className="mb-2 font-medium text-zinc-200">{activeScenarioLabel}</p>
      )}
      {firstPeriod && (
        <p className="mb-3 text-sm text-zinc-400">
          Next band (range, not target): BTC ${(firstPeriod.btcRangeUsd.low / 1000).toFixed(0)}k–${(firstPeriod.btcRangeUsd.high / 1000).toFixed(0)}k · SPX {firstPeriod.spxRange.low}–{firstPeriod.spxRange.high}
        </p>
      )}
      <Link
        href={predictionsHref}
        className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
      >
        View Published Forecast
      </Link>
      <p className="mt-3 text-xs text-zinc-500">Frozen on purpose. Updates ship as new versions.</p>
    </div>
  );
}
