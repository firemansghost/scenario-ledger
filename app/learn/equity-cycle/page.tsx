import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { MissionBanner } from "@/components/MissionBanner";
import { SpyCycleCharts, type SpyPresidentialRollup } from "@/components/learn/SpyCycleCharts";

export const revalidate = 60;

export default async function EquityCyclePage() {
  const supabase = createClient();
  const { data: rollup } = await supabase
    .from("history_rollups")
    .select("data")
    .eq("key", "spy_presidential_cycle_v1")
    .maybeSingle();

  const data = rollup?.data as SpyPresidentialRollup | null;

  return (
    <div className="space-y-6">
      <MissionBanner />
      <Link href="/learn" className="text-sm text-zinc-500 hover:text-white">← Start here</Link>
      <h1 className="text-xl font-semibold">Equity 4-year cycle (presidential cycle on SPY)</h1>
      <p className="text-sm text-zinc-400">
        The 4-year cycle in equities often refers to the presidential cycle: different average returns and volatility by year 1–4. We use SPY price history (no dividends) to show simple stats.
      </p>
      {data ? (
        <SpyCycleCharts data={data} />
      ) : (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
          <p className="text-sm text-zinc-300">
            History pack not built yet. (Admin) run npm run history:build after running npm run backfill:spy-history.
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
