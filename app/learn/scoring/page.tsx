import Link from "next/link";
import { MissionBanner } from "@/components/MissionBanner";

export const revalidate = 60;

export default function ScoringPage() {
  return (
    <div className="space-y-6">
      <MissionBanner />
      <div className="flex items-center gap-2">
        <Link href="/learn" className="text-sm text-zinc-500 hover:text-white">← Start here</Link>
      </div>
      <h1 className="text-xl font-semibold">How scoring works</h1>
      <p className="text-sm text-zinc-400">
        Turn the scoring from &quot;magic&quot; into &quot;mechanical.&quot;
      </p>
      <ol className="list-decimal space-y-4 pl-5 text-sm text-zinc-300">
        <li>
          <strong className="text-zinc-200">Indicator → state.</strong> Each of the 6 indicators (e.g. SPY trend, real yields, credit spreads, VIX regime, BTC structure, USD proxy) is computed weekly and mapped to a state: bullish, neutral, or bearish.
        </li>
        <li>
          <strong className="text-zinc-200">State → weights.</strong> Each indicator has a weight table: for each state, how much it adds to bull / base / bear. Neutral is calibrated to add zero to all (so low-signal weeks don’t collapse into fake certainty).
        </li>
        <li>
          <strong className="text-zinc-200">Weights → scenario scores.</strong> We sum the weighted contributions across indicators, plus a prior (log) for each scenario. That gives raw scores for bull, base, and bear.
        </li>
        <li>
          <strong className="text-zinc-200">Scores → probabilities.</strong> We apply softmax with a temperature. Higher temperature = softer probabilities. So we get three numbers that sum to 1 (e.g. Base 55%, Bull 25%, Bear 20%).
        </li>
      </ol>
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-2 font-medium">What &quot;neutral&quot; means</h2>
        <p className="text-sm text-zinc-400">
          Neutral means the indicator is not clearly bullish or bearish this week. It does not mean &quot;no information&quot;—we explicitly give neutral a zero weight toward all scenarios so that a week full of neutrals doesn’t produce ~100% base; priors and temperature do the rest.
        </p>
      </section>
    </div>
  );
}
