import React from "react";
import type { ForecastConfig, ScenarioKey } from "@/lib/types";

interface ScenarioComparisonGridProps {
  config: ForecastConfig;
}

const SCENARIOS: { key: ScenarioKey; label: string }[] = [
  { key: "bull", label: "Bull" },
  { key: "base", label: "Base" },
  { key: "bear", label: "Bear" },
];

export function ScenarioComparisonGrid({ config }: ScenarioComparisonGridProps) {
  const scenarios = config.scenarios;
  if (!scenarios) return null;

  const allPeriodLabels = new Set<string>();
  for (const s of Object.values(scenarios)) {
    for (const p of s?.periods ?? []) {
      if (p?.label) allPeriodLabels.add(p.label);
    }
  }
  const periodLabels = [...allPeriodLabels].sort();

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
            {periodLabels.map((label) => {
              const period = scenarios.base?.periods?.find((p) => p.label === label);
              if (!period) return null;
              return (
                <React.Fragment key={label}>
                  <tr className="border-b border-zinc-800">
                    <td className="p-2 font-medium text-zinc-300">{period.label}</td>
                    <td className="p-2 text-xs text-zinc-500">BTC</td>
                    {SCENARIOS.map(({ key }) => {
                      const s = scenarios[key];
                      const p = s?.periods?.find((x) => x.label === label);
                      return (
                        <td key={key} className="p-2 font-mono text-zinc-300">
                          {p ? `$${(p.btcRangeUsd.low / 1000).toFixed(0)}k–$${(p.btcRangeUsd.high / 1000).toFixed(0)}k` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr key={`${label}-spx`} className="border-b border-zinc-800">
                    <td className="p-2"></td>
                    <td className="p-2 text-xs text-zinc-500">SPX</td>
                    {SCENARIOS.map(({ key }) => {
                      const s = scenarios[key];
                      const p = s?.periods?.find((x) => x.label === label);
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
