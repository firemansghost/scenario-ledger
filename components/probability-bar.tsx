interface ProbabilityBarProps {
  probs: Record<string, number>;
  active: string;
}

const SCENARIO_COLORS: Record<string, string> = {
  bull: "bg-emerald-600",
  base: "bg-amber-600",
  bear: "bg-rose-600",
};

export function ProbabilityBar({ probs, active }: ProbabilityBarProps) {
  const entries = Object.entries(probs).filter(([, v]) => typeof v === "number");
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-2 text-lg font-medium">Scenario probabilities</h2>
      <div className="flex h-8 overflow-hidden rounded-md border border-zinc-700">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className={`flex items-center justify-center text-xs font-medium text-white ${SCENARIO_COLORS[key] ?? "bg-zinc-600"}`}
            style={{ width: `${(value / total) * 100}%` }}
            title={`${key}: ${(value * 100).toFixed(1)}%`}
          >
            {(value * 100).toFixed(0)}%
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-sm">
        {entries.map(([key, value]) => (
          <span key={key} className={key === active ? "font-semibold" : "text-zinc-400"}>
            {key}: {(value * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </div>
  );
}
