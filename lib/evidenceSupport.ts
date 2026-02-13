/**
 * Shared evidence support computation.
 * Used by tripwireStatus and pathIntegrity for consistent supportDelta.
 */

import type { ScenarioKey } from "./types";

type IndicatorRow = {
  indicator_key: string;
  state: string;
  value?: number | null;
  delta?: number | null;
};

type DefInput = {
  name?: string;
  weights?: Record<string, Partial<Record<string, number>>>;
};

function computeSupport(
  indicators: IndicatorRow[],
  defsByKey: Record<string, DefInput>,
  scenarioKey: ScenarioKey
): number {
  let sum = 0;
  for (const row of indicators) {
    const def = defsByKey[row.indicator_key];
    const weights = def?.weights as Record<string, Partial<Record<string, number>>> | undefined;
    if (!weights || typeof weights !== "object") continue;
    const stateKey = row.state ?? "";
    const stateWeights =
      weights[stateKey] ?? weights[stateKey.toLowerCase()] ?? weights[stateKey.toUpperCase()];
    const w = (stateWeights && typeof stateWeights === "object" && stateWeights[scenarioKey]) ?? 0;
    sum += Number(w);
  }
  return sum;
}

/**
 * supportDelta = support(activeScenario) - max(support(other scenarios))
 */
export function computeSupportDelta(params: {
  indicatorRows: IndicatorRow[];
  defsByKey: Record<string, DefInput>;
  activeScenario: ScenarioKey;
}): number {
  const { indicatorRows, defsByKey, activeScenario } = params;
  const supportBase = computeSupport(indicatorRows, defsByKey, "base");
  const supportBull = computeSupport(indicatorRows, defsByKey, "bull");
  const supportBear = computeSupport(indicatorRows, defsByKey, "bear");
  const supportActive = computeSupport(indicatorRows, defsByKey, activeScenario);
  const maxOther =
    activeScenario === "base"
      ? Math.max(supportBull, supportBear)
      : activeScenario === "bull"
        ? Math.max(supportBase, supportBear)
        : Math.max(supportBase, supportBull);
  return supportActive - maxOther;
}
