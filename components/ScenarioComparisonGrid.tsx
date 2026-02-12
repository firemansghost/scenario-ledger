import React from "react";
import { derivePeriodLabel } from "@/lib/periodLabels";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

interface ScenarioComparisonGridProps {
  config: ForecastConfig;
  currentPeriodIndex?: number;
}

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "bull", label: "Bull" },
  { key: "base", label: "Base" },
  { key: "bear", label: "Bear" },
];

export function ScenarioComparisonGrid({ config, currentPeriodIndex }: ScenarioComparisonGridProps) {
  const scenarios = config.scenarios;
  if (!scenarios) return null;

  const basePeriods = scenarios.base?.periods ?? [];
  const maxPeriods = Math.max(
    ...Object.values(scenarios).map((s) => (s?.periods?.length ?? 0))
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-zinc-400">Scenario comparison by period</h3>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 bg-zinc-900/50">
              <th className="p-2 font-medium text-zinc-400">Period</th>
              <th className="p-2 font-medium text-zinc-400"></th>
              {SCENARIOS.map(({ label }) => (
                <th key={label} className="p-2 font-medium text-zinc-400">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriods }, (_, i) => {
              const p = basePeriods[i] ?? Object.values(scenarios).find((s) => (s?.periods?.length ?? 0) > i)?.periods?.[i];
              const label = p
                ? derivePeriodLabel(p.start, p.end, p.label)
                : `Period ${i + 1}`;
              const isCurrent = i === currentPeriodIndex;
              return (
                <React.Fragment key={i}>
                  <tr className={`border-b border-zinc-800 ${isCurrent ? "bg-amber-950/30" : ""}`}>
                    <td className="p-2 font-medium text-zinc-300">
                      {label}
                      {isCurrent && (
                        <span className="ml-1.5 rounded bg-amber-600/50 px-1.5 py-0.5 text-xs font-medium text-amber-200">Current</span>
                      )}
                    </td>
                    <td className="p-2 text-xs text-zinc-500">BTC</td>
                    {SCENARIOS.map(({ key }) => {
                      const p = scenarios[key]?.periods?.[i];
                      return (
                        <td key={key} className="p-2 font-mono text-zinc-300">
                          {p ? `$${(p.btcRangeUsd.low / 1000).toFixed(0)}k–$${(p.btcRangeUsd.high / 1000).toFixed(0)}k` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className={`border-b border-zinc-800 ${isCurrent ? "bg-amber-950/30" : ""}`}>
                    <td className="p-2"></td>
                    <td className="p-2 text-xs text-zinc-500">SPX</td>
                    {SCENARIOS.map(({ key }) => {
                      const p = scenarios[key]?.periods?.[i];
                      return (
                        <td key={key} className="p-2 font-mono text-zinc-300">
                          {p ? `${p.spxRange.low}–${p.spxRange.high}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
