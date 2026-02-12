import Link from "next/link";
import type { WeeklyBriefResult } from "@/lib/weeklyBrief";

interface WeeklyBriefCardProps {
  brief: WeeklyBriefResult;
  shareMode?: boolean;
}

export function WeeklyBriefCard({ brief, shareMode }: WeeklyBriefCardProps) {
  const primaryHref = shareMode ? "/predictions?share=1#this-week" : brief.ctas.primaryHref;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-lg font-medium">{brief.title}</h2>
      <p className="mb-3 text-sm text-zinc-500">{brief.subtitle}</p>
      <p className="mb-3 font-medium text-zinc-200">{brief.headline}</p>
      {brief.bullets.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 pl-4 text-sm text-zinc-400">
          {brief.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <div className="mb-4 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>Read: {brief.stats.scenarioLabel}</span>
        <span>
          Probs: Base {brief.stats.probDeltas.base >= 0 ? "+" : ""}{brief.stats.probDeltas.base}pp | Bull {brief.stats.probDeltas.bull >= 0 ? "+" : ""}{brief.stats.probDeltas.bull}pp | Bear {brief.stats.probDeltas.bear >= 0 ? "+" : ""}{brief.stats.probDeltas.bear}pp
        </span>
        {brief.stats.btcStatus != null && brief.stats.eqStatus != null && (
          <span>
            Alignment: BTC {brief.stats.btcStatus} · Equity {brief.stats.eqStatus}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={primaryHref}
          className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-black"
        >
          Open Forecast Brief
        </Link>
        <Link
          href={brief.ctas.secondaryHref}
          className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none"
        >
          See alignment
        </Link>
      </div>
    </div>
  );
}
