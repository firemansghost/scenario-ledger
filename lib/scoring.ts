import { softmax } from "./softmax";
import type { IndicatorState, ScenarioKey, TopContributor } from "./types";

const SCENARIOS: ScenarioKey[] = ["bull", "base", "bear"];

interface IndicatorRow {
  indicator_key: string;
  state: IndicatorState;
}

interface WeightRow {
  weights: Record<IndicatorState, Partial<Record<ScenarioKey, number>>>;
}

export interface ScoringInput {
  indicatorRows: IndicatorRow[];
  definitions: Record<string, WeightRow>;
  dataCompleteness: number;
  vixStress?: boolean;
}

export interface ScoringResult {
  scenario_scores: Record<ScenarioKey, number>;
  scenario_probs: Record<ScenarioKey, number>;
  active_scenario: ScenarioKey;
  confidence: "high" | "medium" | "low";
  top_contributors: TopContributor[];
}

export function computeScoring(input: ScoringInput): ScoringResult {
  const { indicatorRows, definitions, dataCompleteness, vixStress } = input;
  const scores: Record<ScenarioKey, number> = { bull: 0, base: 0, bear: 0 };

  for (const row of indicatorRows) {
    const def = definitions[row.indicator_key];
    if (!def?.weights) continue;
    const w = def.weights[row.state];
    if (w) {
      for (const s of SCENARIOS) {
        scores[s] += w[s] ?? 0;
      }
    }
  }

  const scenario_probs = softmax(scores) as Record<ScenarioKey, number>;
  const sorted = SCENARIOS.sort((a, b) => (scenario_probs[b] ?? 0) - (scenario_probs[a] ?? 0));
  const active_scenario = sorted[0] ?? "base";
  const runnerUp = sorted[1] ?? "base";
  const lead = (scenario_probs[active_scenario] ?? 0) - (scenario_probs[runnerUp] ?? 0);

  const top_contributors: TopContributor[] = [];
  for (const row of indicatorRows) {
    const def = definitions[row.indicator_key];
    if (!def?.weights) continue;
    const w = def.weights[row.state];
    if (!w) continue;
    const contribActive = w[active_scenario] ?? 0;
    const contribRunner = w[runnerUp] ?? 0;
    const contribution = contribActive - contribRunner;
    top_contributors.push({ indicator_key: row.indicator_key, contribution });
  }
  top_contributors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const top3 = top_contributors.slice(0, 3);

  let confidence: "high" | "medium" | "low" = "low";
  if (lead >= 0.2 && dataCompleteness >= 0.9) confidence = "high";
  else if (lead >= 0.1 && dataCompleteness >= 0.75) confidence = "medium";
  if (vixStress) {
    if (confidence === "high") confidence = "medium";
    else if (confidence === "medium") confidence = "low";
  }

  return {
    scenario_scores: scores,
    scenario_probs,
    active_scenario,
    confidence,
    top_contributors: top3,
  };
}
