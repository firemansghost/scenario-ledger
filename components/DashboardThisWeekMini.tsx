interface DashboardThisWeekMiniProps {
  weekEnding?: string | null;
  btcStatus?: "in" | "out" | "unknown";
  spyStatus?: "in" | "out" | "unknown";
  btcDriftPct?: number | null;
  spyDriftPct?: number | null;
}

function StatusCell({ status, driftPct }: { status: "in" | "out" | "unknown"; driftPct?: number | null }) {
  if (status === "in") return <span className="text-emerald-400">In band</span>;
  if (status === "out") {
    const pct = driftPct != null ? driftPct.toFixed(1) : "";
    return <span className="text-amber-400">Outside{pct ? ` (${pct}% drift)` : ""}</span>;
  }
  return <span className="text-zinc-500">—</span>;
}

export function DashboardThisWeekMini({
  weekEnding,
  btcStatus = "unknown",
  spyStatus = "unknown",
  btcDriftPct,
  spyDriftPct,
}: DashboardThisWeekMiniProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-1 text-lg font-medium">This week vs forecast</h2>
      {weekEnding && <p className="mb-3 text-sm text-zinc-500">Week ending {weekEnding}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4 font-medium text-zinc-400">BTC</td>
              <td className="py-2"><StatusCell status={btcStatus} driftPct={btcDriftPct} /></td>
            </tr>
            <tr className="border-b border-zinc-800">
              <td className="py-2 pr-4 font-medium text-zinc-400">SPY</td>
              <td className="py-2"><StatusCell status={spyStatus} driftPct={spyDriftPct} /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
