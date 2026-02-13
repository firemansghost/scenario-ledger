import Link from "next/link";
import { derivePeriodLabel } from "@/lib/periodLabels";
import { TimeboxProgress } from "@/components/TimeboxProgress";
import { TimeboxStrip } from "@/components/TimeboxStrip";
import type { ForecastConfig, PeriodBand, ScenarioKey } from "@/lib/types";
import type { TopContributor } from "@/lib/types";

function deUglifyKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\s*_direction\s*$/i, "").trim();
}

function findCurrentPeriod(
  periods: PeriodBand[],
  weekEnding: string
): PeriodBand | null {
  if (!periods?.length) return null;
  const we = new Date(weekEnding).getTime();
  for (const p of periods) {
    const start = new Date(p.start).getTime();
    const end = new Date(p.end).getTime();
    if (we >= start && we <= end) return p;
  }
  return periods[0] ?? null;
}

interface DashboardNowNextWatchProps {
  latestSnapshot: {
    week_ending: string;
    active_scenario: ScenarioKey;
    confidence: string;
    top_contributors: TopContributor[];
  };
  forecastConfig: ForecastConfig;
  forecastVersion?: number | null;
  createdAt?: string | null;
  activeScenarioKey: ScenarioKey;
  shareMode: boolean;
  nerdMode: boolean;
  defsByKey?: Record<string, string>;
}

export function DashboardNowNextWatch({
  latestSnapshot,
  forecastConfig,
  forecastVersion,
  createdAt,
  activeScenarioKey,
  shareMode,
  defsByKey = {},
}: DashboardNowNextWatchProps) {
  const predictionsHref = shareMode ? "/predictions?share=1" : "/predictions";
  const scenario = forecastConfig.scenarios?.[activeScenarioKey];
  const periods = scenario?.periods ?? [];
  const currentPeriod = findCurrentPeriod(periods, latestSnapshot.week_ending) ?? periods[0] ?? null;
  let currentPeriodIndex = currentPeriod
    ? periods.findIndex((p) => p.start === currentPeriod.start && p.end === currentPeriod.end)
    : 0;
  if (currentPeriodIndex < 0) currentPeriodIndex = 0;
  const checkpoints = (scenario?.checkpoints ?? []).slice(0, 3);
  const invalidations = (scenario?.invalidations ?? []).slice(0, 3);
  const topContributors = (latestSnapshot.top_contributors ?? []).slice(0, 3);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* NOW card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-lg font-medium">Now</h2>
        <p className="mb-3 text-sm text-zinc-500">Best fit to the latest evidence. Not destiny.</p>
        <div className="space-y-2">
          {scenario?.label && (
            <p className="font-medium text-zinc-200">{scenario.label}</p>
          )}
          <p className="text-sm text-zinc-400">Confidence: {latestSnapshot.confidence}</p>
          {topContributors.length > 0 && (
            <ul className="list-inside list-disc text-sm text-zinc-400">
              {topContributors.map((c) => (
                <li key={c.indicator_key}>
                  {(defsByKey[c.indicator_key]?.trim() || deUglifyKey(c.indicator_key))} ({c.contribution > 0 ? "+" : ""}
                  {c.contribution.toFixed(2)})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={predictionsHref}
            className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
          >
            View Forecast Brief
          </Link>
          <Link
            href="/alignment"
            className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
          >
            See alignment
          </Link>
        </div>
      </div>

      {/* NEXT card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-lg font-medium">Next</h2>
        <p className="mb-3 text-sm text-zinc-500">Current timebox (envelope, not target).</p>
        {forecastVersion != null && (
          <p className="mb-2 text-xs text-zinc-500">
            <Link href={`${predictionsHref}#forecast-brief`} className="text-zinc-400 hover:text-zinc-200 underline">
              Pinned forecast: v{forecastVersion}
            </Link>
          </p>
        )}
        {periods.length > 0 && (
          <div className="mb-3">
            <TimeboxStrip
              periods={periods}
              currentIndex={currentPeriodIndex}
              shareMode={shareMode}
            />
          </div>
        )}
        {currentPeriod && (
          <div className="space-y-2">
            <p className="font-medium text-zinc-300">
              {derivePeriodLabel(currentPeriod.start, currentPeriod.end, currentPeriod.label)}
            </p>
            <TimeboxProgress
              start={currentPeriod.start}
              end={currentPeriod.end}
              now={new Date()}
            />
            <p className="font-mono text-sm text-zinc-400">
              BTC ${(currentPeriod.btcRangeUsd.low / 1000).toFixed(0)}k–${(currentPeriod.btcRangeUsd.high / 1000).toFixed(0)}k · SPX {currentPeriod.spxRange.low}–{currentPeriod.spxRange.high}
            </p>
            <p className="text-xs text-zinc-500">
              Bands are envelopes, not targets. Edges count as &quot;in.&quot;
            </p>
          </div>
        )}
        <Link
          href={`${predictionsHref}#timeboxes`}
          className="mt-4 inline-block text-sm text-zinc-400 underline hover:text-white"
        >
          Timebox details
        </Link>
      </div>

      {/* WATCH card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="text-lg font-medium">Watch</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Checkpoints = signs we&apos;re on track. Invalidations = signs we&apos;re wrong.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 font-medium text-zinc-400">Checkpoints</p>
            <ul className="list-disc space-y-0.5 pl-4 text-zinc-400">
              {checkpoints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
              {checkpoints.length === 0 && <li className="text-zinc-500">—</li>}
            </ul>
          </div>
          <div>
            <p className="mb-1 font-medium text-zinc-400">Invalidations</p>
            <ul className="list-disc space-y-0.5 pl-4 text-zinc-400">
              {invalidations.map((inv, i) => (
                <li key={i}>{inv}</li>
              ))}
              {invalidations.length === 0 && <li className="text-zinc-500">—</li>}
            </ul>
          </div>
        </div>
        <Link
          href={`${predictionsHref}#tripwires`}
          className="mt-4 inline-block text-sm text-zinc-400 underline hover:text-white"
        >
          See full checklist
        </Link>
      </div>
    </div>
  );
}
