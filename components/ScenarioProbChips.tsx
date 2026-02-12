import { MiniSparkline } from "@/components/MiniSparkline";
import type { ScenarioKey } from "@/lib/types";

const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  base: "Base",
  bull: "Bull",
  bear: "Bear",
};

const SCENARIO_COLORS: Record<ScenarioKey, string> = {
  base: "border-amber-600/50 bg-amber-950/30 text-amber-200",
  bull: "border-emerald-600/50 bg-emerald-950/30 text-emerald-200",
  bear: "border-rose-600/50 bg-rose-950/30 text-rose-200",
};

const SCENARIO_STROKE: Record<ScenarioKey, string> = {
  base: "stroke-amber-400/80",
  bull: "stroke-emerald-400/80",
  bear: "stroke-rose-400/80",
};

type SnapshotForSparkline = {
  scenario_probs?: Record<string, number>;
};

interface ScenarioProbChipsProps {
  scenarioProbs: Record<ScenarioKey, number>;
  prevScenarioProbs?: Record<ScenarioKey, number> | null;
  snapshotsForSparkline?: SnapshotForSparkline[];
}

export function ScenarioProbChips({ scenarioProbs, prevScenarioProbs, snapshotsForSparkline = [] }: ScenarioProbChipsProps) {
  const keys: ScenarioKey[] = ["base", "bull", "bear"];

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-2 text-lg font-medium">Scenario probabilities</h2>
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => {
          const pct = (scenarioProbs[key] ?? 0) * 100;
          const prevProb = prevScenarioProbs?.[key];
          const deltaPp = prevProb != null ? ((scenarioProbs[key] ?? 0) - prevProb) * 100 : null;
          const deltaStr =
            deltaPp != null
              ? `Δ ${deltaPp >= 0 ? "+" : ""}${deltaPp.toFixed(1)}pp`
              : "Δ —";

          const probSeries = snapshotsForSparkline
            .map((s) => ((s.scenario_probs ?? {})[key] ?? 0) * 100)
            .filter((v) => Number.isFinite(v));

          return (
            <div
              key={key}
              className={`flex flex-col gap-1 rounded-md border px-3 py-1.5 text-sm font-medium ${SCENARIO_COLORS[key] ?? "border-zinc-600 text-zinc-300"}`}
            >
              <span>{SCENARIO_LABELS[key]} {pct.toFixed(1)}% ({deltaStr})</span>
              {probSeries.length >= 2 && (
                <MiniSparkline
                  values={probSeries}
                  width={70}
                  height={14}
                  strokeClassName={SCENARIO_STROKE[key]}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
