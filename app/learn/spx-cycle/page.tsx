import Link from "next/link";
import { MissionBanner } from "@/components/MissionBanner";

export const revalidate = 60;

export default function SpxCyclePage() {
  return (
    <div className="space-y-6">
      <MissionBanner />
      <Link href="/learn" className="text-sm text-zinc-500 hover:text-white">← Start here</Link>
      <h1 className="text-xl font-semibold">S&P / presidential cycle</h1>
      <p className="text-sm text-zinc-400">4-year cycle idea for equities: midterm-year tendency. We reference this conceptually in the forecast.</p>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4">
        <p className="text-sm text-zinc-300">Deep SPY history not yet ingested. v1.7+: we’ll compute basic stats from stored history and show them here.</p>
      </div>
    </div>
  );
}
