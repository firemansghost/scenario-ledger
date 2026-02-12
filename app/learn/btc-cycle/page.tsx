import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { BtcCycleTable } from "@/components/learn/BtcCycleTable";
import { BITCOIN_CYCLE_REFERENCE, CYCLE_RULE_OF_THUMB } from "@/lib/education/bitcoinCycle";

export const revalidate = 60;

export default async function BtcCyclePage() {
  const supabase = createClient();
  const { data: rollup } = await supabase
    .from("history_rollups")
    .select("data")
    .eq("key", "btc_cycle_daycounts_v1")
    .maybeSingle();

  const cycles =
    (rollup?.data as { cycles?: { cycleLabel: string; bottom: string; halving: string; peak: string; nextBottom: string; bullDays?: number; bearDays?: number; halvingToPeakDays?: number }[] })?.cycles ??
    BITCOIN_CYCLE_REFERENCE.map((r) => ({ ...r }));

  return (
    <div className="space-y-6">
      <Link href="/learn" className="text-sm text-zinc-500 hover:text-white">← Start here</Link>
      <h1 className="text-xl font-semibold">Bitcoin 4-year cycle (days & phases)</h1>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">What we mean by cycle</h2>
        <p className="text-sm text-zinc-300">
          One &quot;cycle&quot; is bottom → halving → peak → next bottom. Bull phase is bottom to peak; bear is peak to next bottom. Halving→peak is the stretch that often gets the most attention.
        </p>
      </section>
      <BtcCycleTable cycles={cycles} />
      <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
        <p className="text-sm text-amber-200">{CYCLE_RULE_OF_THUMB}</p>
      </div>
      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">How this connects to the forecast</h2>
        <p className="text-sm text-zinc-300">
          Our published forecast uses ATH windows and timeline phases that are informed by this cycle structure (e.g. halving→peak ~17–18 months). The scenario bands and checkpoints are not &quot;prediction from the table&quot;—they’re a framework. See the <Link href="/predictions" className="text-zinc-400 underline hover:text-white">Predictions</Link> page for the actual bands and timeline.
        </p>
      </section>
      <section className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Where this can break</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-400">
          <li>Small sample size (only a few cycles).</li>
          <li>Structural change: ETFs, regulation, institutional flows can change the playbook.</li>
          <li>Definitions vary (e.g. which bottom, which peak). We use a simple reference.</li>
        </ul>
      </section>
    </div>
  );
}
