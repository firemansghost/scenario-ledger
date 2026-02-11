import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { MissionBanner } from "@/components/MissionBanner";
import { EquityCycleDataCoverage, type EquityRollupMeta } from "@/components/learn/EquityCycleDataCoverage";
import { SpyCycleCharts, type SpyPresidentialRollup } from "@/components/learn/SpyCycleCharts";

export const revalidate = 60;

export default async function EquityCyclePage() {
  const supabase = createClient();
  const { data: spxRollup } = await supabase
    .from("history_rollups")
    .select("data, meta")
    .eq("key", "spx_presidential_cycle_v1")
    .maybeSingle();
  const { data: spyRollup } = await supabase
    .from("history_rollups")
    .select("data, meta")
    .eq("key", "spy_presidential_cycle_v1")
    .maybeSingle();

  const rollup = spxRollup ?? spyRollup;
  const data = rollup?.data as SpyPresidentialRollup | null;
  const meta = rollup?.meta as EquityRollupMeta | null;
  const seriesUsed = spxRollup ? "spx" : spyRollup ? "spy" : null;

  const coverageMeta: EquityRollupMeta | null =
    meta?.series_key_used != null
      ? meta
      : data?.coverage
        ? {
            series_key_used: (seriesUsed as "spx" | "spy") ?? "spy",
            min_dt: data.coverage.startDate ?? "",
            max_dt: data.coverage.endDate ?? "",
            years_covered: data.coverage.years ?? 0,
            rowCount: 0,
          }
        : null;

  return (
    <div className="space-y-6">
      <MissionBanner />
      <Link href="/learn" className="text-sm text-zinc-500 hover:text-white">← Start here</Link>
      <h1 className="text-xl font-semibold">Equity 4-year cycle (presidential cycle)</h1>
      <p className="text-sm text-zinc-400">
        The 4-year cycle in equities often refers to the presidential cycle: different average returns and volatility by year 1–4. Stats below use S&P 500 Index (SPX) when available, otherwise SPY ETF—both price return only (no dividends).
      </p>
      {data ? (
        <>
          {coverageMeta && <EquityCycleDataCoverage meta={coverageMeta} />}
          <SpyCycleCharts data={data} seriesLabel={seriesUsed === "spx" ? "SPX" : "SPY"} />
        </>
      ) : (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">
            History pack not built yet. (Admin) run <code className="rounded bg-zinc-800 px-1">npm run history:build</code> after
            running <code className="rounded bg-zinc-800 px-1">npm run backfill:spy-history</code>
            {", or "}
            <code className="rounded bg-zinc-800 px-1">npm run backfill:spx-history</code> for longer SPX history.
          </p>
        </div>
      )}
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Definitions</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-400">
          <li>Year 4 = election year (calendar year % 4 === 0)</li>
          <li>Year 1 = post-election (year % 4 === 1)</li>
          <li>Year 2 = midterm (year % 4 === 2)</li>
          <li>Year 3 = pre-election (year % 4 === 3)</li>
        </ul>
      </section>
    </div>
  );
}
