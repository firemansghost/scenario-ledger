export interface EquityRollupMeta {
  series_key_used: "spx" | "spy";
  min_dt: string;
  max_dt: string;
  years_covered: number;
  rows_used?: number;
  rowCount?: number;
}

interface EquityCycleDataCoverageProps {
  meta: EquityRollupMeta;
}

function seriesLabel(key: "spx" | "spy"): string {
  return key === "spx" ? "S&P 500 Index (SPX)" : "SPY ETF (price only)";
}

export function EquityCycleDataCoverage({ meta }: EquityCycleDataCoverageProps) {
  const cyclesApprox = Math.floor(meta.years_covered / 4);
  const thinCoverage = meta.years_covered < 12;
  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium text-zinc-300">Data coverage</h2>
      <ul className="space-y-1 text-sm text-zinc-400">
        <li>Series used: {seriesLabel(meta.series_key_used)}</li>
        <li>Coverage: {meta.min_dt} → {meta.max_dt}</li>
        <li>Returns shown: price return (no dividends)</li>
        <li>Sample: ~{meta.years_covered} years (~{cyclesApprox} presidential cycles)</li>
      </ul>
      <p className="text-xs text-zinc-500">Stats exclude incomplete calendar years.</p>
      {thinCoverage && (
        <p className="text-amber-400/90 text-sm">
          Coverage is thin; stats are low-confidence.
        </p>
      )}
      <p className="pt-2 text-xs text-zinc-500 italic">
        This is descriptive history, not a forecast engine.
      </p>
    </div>
  );
}
