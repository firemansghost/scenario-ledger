import Link from "next/link";
import { derivePeriodLabel } from "@/lib/periodLabels";
import type { ForecastConfig, PeriodBand, ScenarioKey } from "@/lib/types";

interface PublishedForecastSummaryProps {
  config: ForecastConfig;
  version?: number;
  createdAt?: string | null;
  activeScenario?: ScenarioKey;
}

function TimeboxRow({ p }: { p: PeriodBand }) {
  const label = derivePeriodLabel(p.start, p.end, p.label);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-medium text-zinc-300">{label}</span>
      <span className="font-mono text-zinc-400">
        BTC ${(p.btcRangeUsd.low / 1000).toFixed(0)}k–${(p.btcRangeUsd.high / 1000).toFixed(0)}k · SPX {p.spxRange.low}–{p.spxRange.high}
      </span>
    </div>
  );
}

export function PublishedForecastSummary({
  config,
  version,
  createdAt,
  activeScenario = "base",
}: PublishedForecastSummaryProps) {
  const scenario = config.scenarios?.[activeScenario];
  const firstPeriods = (scenario?.periods ?? []).slice(0, 4);
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

      {firstPeriods.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Next timeboxes</p>
          <div className="space-y-1">
            {firstPeriods.map((p, i) => (
              <TimeboxRow key={i} p={p} />
            ))}
          </div>
          <p className="text-xs text-zinc-600">
            Bands are envelopes, not targets. Edges count as &quot;in.&quot;
          </p>
          <p className="text-xs text-zinc-600">
            Equity ranges are shown in SPX points. Alignment converts bands to SPY using that week&apos;s factor.
          </p>
        </div>
      )}

      {scenario && (scenario.checkpoints?.length > 0 || scenario.invalidations?.length > 0) && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Tripwires (preview)</p>
          <p className="text-xs text-zinc-500">
            Checkpoints = signs we&apos;re on track. Invalidations = signs we&apos;re wrong.
          </p>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <ul className="list-disc space-y-0.5 pl-4 text-zinc-400">
              {(scenario.checkpoints ?? []).slice(0, 3).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <ul className="list-disc space-y-0.5 pl-4 text-zinc-400">
              {(scenario.invalidations ?? []).slice(0, 3).map((inv, i) => (
                <li key={i}>{inv}</li>
              ))}
            </ul>
          </div>
          <Link href="#tripwires" className="text-xs text-zinc-500 underline hover:text-zinc-300">
            Jump to full checklist
          </Link>
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
