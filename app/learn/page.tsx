import Link from "next/link";
import { MissionBanner } from "@/components/MissionBanner";

export const revalidate = 60;

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <MissionBanner />
      <h1 className="text-xl font-semibold">Start here</h1>
      <p className="text-sm text-zinc-400">Onboarding in ~60 seconds.</p>
      <div className="grid gap-4">
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">What this is</h2>
          <p className="text-sm text-zinc-400">A scenario tracker: evidence, scenario probabilities (bull/base/bear), and alignment vs published bands. Not a crystal ball.</p>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">What it is NOT</h2>
          <p className="text-sm text-zinc-400">Not investment advice. Not a trading system. Probabilities reflect current evidence, not certainty.</p>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">How to read probabilities</h2>
          <p className="text-sm text-zinc-400">The bar shows evidence weight per scenario. Priors and temperature keep low-signal weeks from looking overconfident.</p>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">What receipts mean</h2>
          <p className="text-sm text-zinc-400">Weekly indicator evidence (value, state, contribution). Expand &quot;Show receipts&quot; in Nerd Mode for the full table.</p>
        </section>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="mb-2 font-medium">Forecast versions (immutability)</h2>
          <p className="text-sm text-zinc-400">Forecasts are versioned and immutable. Updates ship as new versions. Dashboard shows which version was used.</p>
        </section>
      </div>
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <h2 className="mb-2 font-medium">Go deeper</h2>
        <ul className="space-y-2 text-sm">
          <li><Link href="/learn/bitcoin-cycle" className="text-zinc-400 underline hover:text-white">Bitcoin 4-year cycle</Link> — cycle dates and rule of thumb</li>
          <li><Link href="/learn/spx-cycle" className="text-zinc-400 underline hover:text-white">S&P / presidential cycle</Link> — midterm-year tendency</li>
          <li><Link href="/learn/how-scoring-works" className="text-zinc-400 underline hover:text-white">How scoring works</Link> — indicator to probabilities</li>
        </ul>
      </section>
    </div>
  );
}
