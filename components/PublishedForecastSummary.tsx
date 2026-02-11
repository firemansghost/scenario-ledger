import Link from "next/link";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

interface PublishedForecastSummaryProps {
  config: ForecastConfig;
  version?: number;
  createdAt?: string | null;
  activeScenario?: ScenarioKey;
}

export function PublishedForecastSummary({
  config,
  version,
  createdAt,
  activeScenario = "base",
}: PublishedForecastSummaryProps) {
  const scenario = config.scenarios?.[activeScenario];
  const firstPeriod = scenario?.periods?.[0];
  const athWindows = config.athWindows as
    | { key?: string; label?: string; displayRange?: string }[]
    | undefined;

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Published Forecast (Pinned)</h2>
        <p className="text-sm text-zinc-500">
          Frozen on purpose. Weekly evidence updates the read — not the published bands.
        </p>
      </div>

      {(version != null || createdAt) && (
        <p className="text-sm text-zinc-400">
          Pinned: v{version ?? "—"}
          {createdAt != null && ` · ${new Date(createdAt).toLocaleDateString()}`}
        </p>
      )}

      {scenario && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">Current read</p>
          <p className="font-medium text-zinc-200">{scenario.label}</p>
          <p className="text-xs text-zinc-600">
            Best fit to the latest evidence. Not destiny.
          </p>
        </div>
      )}

      {firstPeriod && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">Key bands (next period)</p>
          <p className="font-mono text-sm text-zinc-300">
            BTC: ${(firstPeriod.btcRangeUsd.low / 1000).toFixed(0)}k–$
            {(firstPeriod.btcRangeUsd.high / 1000).toFixed(0)}k · SPX:{" "}
            {firstPeriod.spxRange.low}–{firstPeriod.spxRange.high}
          </p>
          <p className="text-xs text-zinc-600">
            Bands are envelopes, not targets. Edges count as &quot;in.&quot;
          </p>
        </div>
      )}

      {(athWindows?.length ?? 0) > 0 && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">ATH windows</p>
          <ul className="list-disc pl-4 text-sm text-zinc-400">
            {(athWindows ?? []).map((w, i) => (
              <li key={w.key ?? i}>
                {w.label}: {w.displayRange}
              </li>
            ))}
          </ul>
          <p className="text-xs text-zinc-600">
            &quot;Window&quot; means timing probability, not a guarantee the market behaves.
          </p>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <p className="text-sm text-zinc-400">Learn more</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <li>
            <Link
              href="/learn/btc-cycle"
              className="text-zinc-400 underline hover:text-white"
            >
              Bitcoin cycle history (days &amp; phases)
            </Link>
          </li>
          <li>
            <Link
              href="/learn/equity-cycle"
              className="text-zinc-400 underline hover:text-white"
            >
              Equity 4-year cycle (presidential pattern)
            </Link>
          </li>
          <li>
            <Link
              href="/learn/scoring"
              className="text-zinc-400 underline hover:text-white"
            >
              How scoring works (mechanics, not vibes)
            </Link>
          </li>
        </ul>

        <p className="text-xs text-zinc-600 pt-1">
          If you need certainty, buy a toaster.
        </p>
      </div>
    </div>
  );
}
