import Link from "next/link";
import { MissionBanner } from "@/components/MissionBanner";

export const revalidate = 60;

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <MissionBanner />
      <h1 className="text-xl font-semibold">Learn</h1>
      <p className="text-sm text-zinc-400">Explainer hub: how to read the app and where the forecast comes from.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/learn#start"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600 hover:bg-zinc-800/50"
        >
          <h2 className="mb-1 font-medium">1. Start here</h2>
          <p className="text-sm text-zinc-400">How to read ScenarioLedger — what it is, what it isn’t, probabilities, receipts, versions.</p>
        </Link>
        <Link
          href="/learn/btc-cycle"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600 hover:bg-zinc-800/50"
        >
          <h2 className="mb-1 font-medium">2. Bitcoin cycle history</h2>
          <p className="text-sm text-zinc-400">4-year cycle: bottom → halving → peak → next bottom. Day counts and rule of thumb.</p>
        </Link>
        <Link
          href="/learn/equity-cycle"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600 hover:bg-zinc-800/50"
        >
          <h2 className="mb-1 font-medium">3. Equity 4-year cycle history</h2>
          <p className="text-sm text-zinc-400">Presidential cycle on SPY: avg returns by cycle year, midterm drawdown stats.</p>
        </Link>
        <Link
          href="/learn/scoring"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-600 hover:bg-zinc-800/50"
        >
          <h2 className="mb-1 font-medium">4. Scoring model</h2>
          <p className="text-sm text-zinc-400">Indicator → state → weights → scores → probabilities (softmax + temperature).</p>
        </Link>
      </div>
      <section id="start" className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-2 font-medium">How to read ScenarioLedger</h2>
        <div className="space-y-3 text-sm text-zinc-400">
          <p><strong className="text-zinc-200">What this is:</strong> A scenario tracker: evidence, scenario probabilities (bull/base/bear), and alignment vs published bands. Not a crystal ball.</p>
          <p><strong className="text-zinc-200">What it is NOT:</strong> Not investment advice. Not a trading system. Probabilities reflect current evidence, not certainty.</p>
          <p><strong className="text-zinc-200">How to read probabilities:</strong> The bar shows evidence weight per scenario. Priors and temperature keep low-signal weeks from looking overconfident.</p>
          <p><strong className="text-zinc-200">What receipts mean:</strong> Weekly indicator evidence (value, state, contribution). Expand &quot;Show receipts&quot; in Nerd Mode for the full table.</p>
          <p><strong className="text-zinc-200">Forecast versions:</strong> Forecasts are versioned and immutable. Updates ship as new versions. Dashboard shows which version was used.</p>
        </div>
      </section>
    </div>
  );
}
