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
        <h2 className="text-lg font-medium">Published Forecast</h2>
        <p className="text-sm text-zinc-500">
          What we published, when we published it, and what it implies right now.
        </p>
      </div>

      {(version != null || createdAt) && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">Published as-of</p>
          <p className="text-sm text-zinc-500">
            v{version ?? "—"}
            {createdAt != null && ` · ${new Date(createdAt).toLocaleDateString()}`}
          </p>
          <p className="text-xs text-zinc-600">
            Forecasts don’t get edited. Updates ship as new versions.
          </p>
        </div>
      )}

      {scenario && (
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">Current read (scenario)</p>
          <p className="font-medium text-zinc-200">{scenario.label}</p>
          <p className="text-xs text-zinc-600">
            This is the model’s best fit to the latest evidence, not destiny.
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
            Bands are ranges, not targets. Price can tag edges and still be “in.”
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
            “Window” means timing probability, not a guarantee the market behaves.
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
          Educational speculation. Not investment advice. If you need certainty, buy a toaster.
        </p>
      </div>
    </div>
  );
}
