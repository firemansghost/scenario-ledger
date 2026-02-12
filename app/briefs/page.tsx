import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { SeenWeekBadge } from "@/components/SeenWeekBadge";
import { StreakMeterCard } from "@/components/StreakMeterCard";
import type { ScenarioKey } from "@/lib/types";

export const revalidate = 60;

function formatDrift(inBand: boolean, driftPct?: number): string {
  if (inBand) return "In (0.0%)";
  if (driftPct != null) {
    const sign = driftPct >= 0 ? "+" : "";
    return `Out (${sign}${driftPct.toFixed(1)}%)`;
  }
  return "—";
}

export default async function BriefsPage({
  searchParams,
}: {
  searchParams: Promise<{ share?: string }>;
}) {
  const params = await searchParams;
  const shareMode = params?.share === "1";
  const supabase = createClient();
  const { data: snapshots } = await supabase
    .from("weekly_snapshots")
    .select("week_ending, active_scenario, confidence, alignment")
    .order("week_ending", { ascending: false })
    .limit(12);

  const latestWeek = snapshots?.[0]?.week_ending;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Brief Archive</h1>
      <p className="text-sm text-zinc-400">
        Past weekly briefs. Each links to the full brief for that week.
      </p>
      {!shareMode && (
        <StreakMeterCard checkinWeek={latestWeek ?? null} shareMode={shareMode} />
      )}
      <div className="space-y-3">
        {(snapshots ?? []).map((s) => {
          const align = (s.alignment as Record<string, { btc?: { inBand: boolean; driftPct?: number }; spy?: { inBand: boolean; driftPct?: number } } | undefined>) ?? {};
          const baseAlign = align["base"];
          const btcStatus = baseAlign?.btc != null ? formatDrift(baseAlign.btc.inBand, baseAlign.btc.driftPct) : "—";
          const eqStatus = baseAlign?.spy != null ? formatDrift(baseAlign.spy.inBand, baseAlign.spy.driftPct) : "—";

          return (
            <Link
              key={s.week_ending}
              href={`/briefs/${s.week_ending}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-200">{s.week_ending}</span>
                  <SeenWeekBadge weekEnding={String(s.week_ending)} />
                </div>
                <span className="text-sm text-zinc-500">
                  {String(s.active_scenario).charAt(0).toUpperCase() + String(s.active_scenario).slice(1)} ({s.confidence})
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-zinc-500">
                <span>BTC {btcStatus}</span>
                <span>Equity {eqStatus}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">Open brief →</p>
            </Link>
          );
        })}
      </div>
      {(snapshots?.length ?? 0) === 0 && (
        <p className="text-zinc-500">No briefs yet. Run the weekly cron.</p>
      )}
    </div>
  );
}
