import Link from "next/link";
import { BITCOIN_CYCLE_REFERENCE, CYCLE_RULE_OF_THUMB } from "@/lib/education/bitcoinCycle";

export const revalidate = 60;

export default function BitcoinCyclePage() {
  return (
    <div className="space-y-6">
      <Link href="/learn" className="text-sm text-zinc-500 hover:text-white">← Start here</Link>
      <h1 className="text-xl font-semibold">Bitcoin 4-year cycle</h1>
      <p className="text-sm text-zinc-400">Reference dates: Bottom → Halving → Peak → Next Bottom.</p>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900/50">
              <th className="p-3 font-medium">Cycle</th>
              <th className="p-3 font-medium">Bottom</th>
              <th className="p-3 font-medium">Halving</th>
              <th className="p-3 font-medium">Peak</th>
              <th className="p-3 font-medium">Next bottom</th>
            </tr>
          </thead>
          <tbody>
            {BITCOIN_CYCLE_REFERENCE.map((row, i) => (
              <tr key={i} className="border-b border-zinc-800">
                <td className="p-3">{row.cycleLabel}</td>
                <td className="p-3 font-mono">{row.bottom}</td>
                <td className="p-3 font-mono">{row.halving}</td>
                <td className="p-3 font-mono">{row.peak}</td>
                <td className="p-3 font-mono">{row.nextBottom}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4">
        <p className="text-sm text-amber-200">{CYCLE_RULE_OF_THUMB}</p>
      </div>
      <p className="text-xs text-zinc-500">Small sample; structural change risk; definitions vary. Context only.</p>
    </div>
  );
}
