/**
 * Lightweight tripwire status scoring.
 * Heuristic, transparent, not auto-verified. Uses alignment + evidence only.
 */

import type { ScenarioKey } from "./types";

export type TripwireKind = "checkpoint" | "invalidation";
export type TripwireStatus = "confirming" | "watching" | "risk" | "unknown";

export interface TripwireResult {
  kind: TripwireKind;
  text: string;
  status: TripwireStatus;
  reason: string;
  evidence?: string[];
}

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

type SnapshotInput = {
  week_ending: string;
  active_scenario: ScenarioKey;
  alignment?: Record<string, AlignRow | undefined>;
};

type IndicatorRow = {
  indicator_key: string;
  state: string;
  value: number | null;
  delta: number | null;
};

type DefInput = {
  name?: string;
  weights?: Record<string, Partial<Record<string, number>>>;
};

type ScenarioConfigInput = {
  checkpoints: string[];
  invalidations: string[];
};

export interface ScoreTripwiresParams {
  latestSnapshot: SnapshotInput | null;
  prevSnapshot?: SnapshotInput | null;
  latestIndicators: IndicatorRow[];
  defsByKey: Record<string, DefInput>;
  scenarioConfig: ScenarioConfigInput;
}

function getBtcDrift(align: AlignRow | undefined): number | null {
  const cell = align?.btc;
  if (!cell) return null;
  if (cell.inBand) return 0;
  return cell.driftPct ?? null;
}

function getSpyDrift(align: AlignRow | undefined): number | null {
  const cell = align?.spy;
  if (!cell) return null;
  if (cell.inBand) return 0;
  return cell.driftPct ?? null;
}

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

export function scoreTripwires(params: ScoreTripwiresParams): TripwireResult[] {
  const {
    latestSnapshot,
    latestIndicators,
    defsByKey,
    scenarioConfig,
  } = params;

  const results: TripwireResult[] = [];
  const activeScenario = latestSnapshot?.active_scenario ?? "base";
  const align = latestSnapshot?.alignment?.[activeScenario] ?? latestSnapshot?.alignment?.base;

  const unknownResult = (
    kind: TripwireKind,
    text: string
  ): TripwireResult => ({
    kind,
    text,
    status: "unknown",
    reason: "Not enough data.",
  });

  if (!latestSnapshot) {
    for (const c of scenarioConfig.checkpoints) {
      results.push(unknownResult("checkpoint", c));
    }
    for (const inv of scenarioConfig.invalidations) {
      results.push(unknownResult("invalidation", inv));
    }
    return results;
  }

  const btcDrift = getBtcDrift(align);
  const spyDrift = getSpyDrift(align);
  const btcOut = align?.btc ? !align.btc.inBand : false;
  const eqOut = align?.spy ? !align.spy.inBand : false;
  const btcAbs = btcDrift != null ? Math.abs(btcDrift) : 0;
  const spyAbs = spyDrift != null ? Math.abs(spyDrift) : 0;
  const bigDrift = btcAbs >= 2.0 || spyAbs >= 2.0;

  let bullishCount = 0;
  let bearishCount = 0;
  for (const row of latestIndicators) {
    const s = (row.state ?? "").toLowerCase();
    if (s === "bullish") bullishCount++;
    else if (s === "bearish") bearishCount++;
  }
  const bullBearDiff = bullishCount - bearishCount;

  const supportBase = computeSupport(latestIndicators, defsByKey, "base");
  const supportBull = computeSupport(latestIndicators, defsByKey, "bull");
  const supportBear = computeSupport(latestIndicators, defsByKey, "bear");
  const supportActive = computeSupport(latestIndicators, defsByKey, activeScenario);
  const maxOther =
    activeScenario === "base"
      ? Math.max(supportBull, supportBear)
      : activeScenario === "bull"
        ? Math.max(supportBase, supportBear)
        : Math.max(supportBase, supportBull);
  const supportDelta = supportActive - maxOther;

  const evidenceBullets: string[] = [];
  if (bigDrift) {
    if (btcDrift != null && !align?.btc?.inBand) {
      evidenceBullets.push(`BTC drift: ${btcDrift >= 0 ? "+" : ""}${btcDrift.toFixed(1)}%`);
    }
    if (spyDrift != null && !align?.spy?.inBand) {
      evidenceBullets.push(`Equity drift: ${spyDrift >= 0 ? "+" : ""}${spyDrift.toFixed(1)}%`);
    }
  }
  const topMovers = latestIndicators
    .filter((r) => r.delta != null && Math.abs(r.delta) > 0.01)
    .sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))
    .slice(0, 2);
  for (const r of topMovers) {
    const name = defsByKey[r.indicator_key]?.name ?? r.indicator_key.replace(/_/g, " ");
    evidenceBullets.push(`${name}: ${(r.state ?? "—").toLowerCase()}`);
  }

  const bothInBand = !btcOut && !eqOut;
  const evidenceLean =
    bullBearDiff >= 2 ? "bullish" : bullBearDiff <= -2 ? "bearish" : "mixed";

  function reasonForCheckpoint(status: TripwireStatus): string {
    if (status === "confirming") {
      if (bothInBand) return `BTC + Equity both in-band; evidence leans ${evidenceLean}.`;
      return `Evidence leans ${evidenceLean}; support for ${activeScenario} positive.`;
    }
    if (status === "watching") {
      if (btcOut || eqOut) return `One asset out-of-band; evidence ${evidenceLean}.`;
      return "Evidence mixed; no strong tilt.";
    }
    if (status === "risk") {
      if (bigDrift) return `Drift ≥2% on ${btcOut && eqOut ? "both" : "one"} asset; evidence leans ${evidenceLean}.`;
      return `Evidence leans against ${activeScenario}; supportDelta negative.`;
    }
    return "Not enough data.";
  }

  function reasonForInvalidation(status: TripwireStatus): string {
    if (status === "risk") {
      if (btcOut && eqOut) return "BTC + Equity both out-of-band.";
      if (bigDrift) return `Equity drift ${spyDrift != null ? (spyDrift >= 0 ? "+" : "") + spyDrift.toFixed(1) + "%" : "—"}; evidence leaning bearish.`;
      return `Evidence leaning against path; supportDelta ≤ -0.5.`;
    }
    if (status === "watching") {
      if (btcOut || eqOut) return "One asset out-of-band; evidence mixed.";
      return "Evidence slightly negative; watching.";
    }
    if (status === "confirming") {
      return `Both in-band; evidence strongly supports path.`;
    }
    return "Not enough data.";
  }

  let checkpointStatus: TripwireStatus;
  if (bigDrift || supportDelta <= -0.5) {
    checkpointStatus = "risk";
  } else if (supportDelta >= 0.5 || bullBearDiff >= 2) {
    checkpointStatus = "confirming";
  } else if (supportDelta >= -0.5 && supportDelta < 0.5) {
    checkpointStatus = "watching";
  } else {
    checkpointStatus = "watching";
  }

  let invalidationStatus: TripwireStatus;
  if (bigDrift || supportDelta <= -0.5 || (btcOut && eqOut)) {
    invalidationStatus = "risk";
  } else if (supportDelta < 0 && supportDelta > -0.5) {
    invalidationStatus = "watching";
  } else if (supportDelta >= 0.5 && bothInBand) {
    invalidationStatus = "confirming";
  } else {
    invalidationStatus = "watching";
  }

  for (const c of scenarioConfig.checkpoints) {
    results.push({
      kind: "checkpoint",
      text: c,
      status: checkpointStatus,
      reason: reasonForCheckpoint(checkpointStatus),
      evidence: evidenceBullets.length > 0 ? evidenceBullets : undefined,
    });
  }

  for (const inv of scenarioConfig.invalidations) {
    results.push({
      kind: "invalidation",
      text: inv,
      status: invalidationStatus,
      reason: reasonForInvalidation(invalidationStatus),
      evidence: evidenceBullets.length > 0 ? evidenceBullets : undefined,
    });
  }

  return results;
}

/** Summarize tripwire results into counts. */
export function summarizeTripwires(results: TripwireResult[]): {
  confirming: number;
  watching: number;
  risk: number;
} {
  const counts = { confirming: 0, watching: 0, risk: 0 };
  for (const r of results) {
    if (r.status === "confirming") counts.confirming++;
    else if (r.status === "watching") counts.watching++;
    else if (r.status === "risk") counts.risk++;
  }
  return counts;
}
