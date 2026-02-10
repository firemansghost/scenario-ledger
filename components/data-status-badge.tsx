interface DataStatusBadgeProps {
  dataCompleteness: number;
  weekEnding: string;
}

function getDataStatus(dataCompleteness: number, weekEnding: string): "ok" | "degraded" | "stale" {
  const now = new Date();
  const we = new Date(weekEnding);
  const daysSince = (now.getTime() - we.getTime()) / (1000 * 60 * 60 * 24);
  if (dataCompleteness >= 0.9 && daysSince < 14) return "ok";
  if (dataCompleteness >= 0.75 || daysSince < 21) return "degraded";
  return "stale";
}

export function DataStatusBadge({ dataCompleteness, weekEnding }: DataStatusBadgeProps) {
  const status = getDataStatus(dataCompleteness, weekEnding);
  const labels = { ok: "OK", degraded: "Degraded", stale: "Stale" };
  const classes = {
    ok: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
    degraded: "bg-amber-900/50 text-amber-400 border-amber-700",
    stale: "bg-rose-900/50 text-rose-400 border-rose-700",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded border px-2 py-1 text-sm font-medium ${classes[status]}`}>
        Data status: {labels[status]}
      </span>
      <span className="text-xs text-zinc-500">Completeness: {(dataCompleteness * 100).toFixed(0)}%</span>
    </div>
  );
}
