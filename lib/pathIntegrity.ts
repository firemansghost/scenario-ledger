/**
 * Path Integrity Score: consistency of price/evidence with published bands.
 * Not a trade signal, not predictive. Transparent, explainable.
 */

import type { ScenarioKey } from "./types";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

export type PathIntegrityGrade = "A" | "B" | "C" | "D" | "F";

export interface PathIntegrity {
  score: number;
  grade: PathIntegrityGrade;
  label: string;
  deltaWoW: number | null;
  components: {
    alignment: number;
    evidence: number;
    tripwires: number;
    confidence: number;
  };
  notes: string[];
}

type SnapshotInput = {
  week_ending: string;
  active_scenario: ScenarioKey;
  confidence?: string;
  alignment?: Record<string, AlignRow | undefined>;
};

type TripwireSummaryInput = {
  confirming: number;
  watching: number;
  risk: number;
};

export interface ComputePathIntegrityParams {
  latestSnapshot: SnapshotInput;
  prevSnapshot?: SnapshotInput | null;
  supportDelta: number;
  tripwireSummary: TripwireSummaryInput;
  /** For deltaWoW: prev week's supportDelta (optional) */
  prevSupportDelta?: number;
  /** For deltaWoW: prev week's tripwireSummary (optional) */
  prevTripwireSummary?: TripwireSummaryInput;
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

function mapSupportDeltaToEvidence(supportDelta: number): number {
  if (supportDelta >= 0.8) return 30;
  if (supportDelta >= 0.4) return 24 + (supportDelta - 0.4) * (6 / 0.4);
  if (supportDelta >= 0) return 18 + supportDelta * (6 / 0.4);
  if (supportDelta >= -0.4) return 12 + supportDelta * (6 / 0.4);
  if (supportDelta >= -0.8) return 6 + (supportDelta + 0.4) * (6 / 0.4);
  return 6;
}

function computeTripwireScore(summary: TripwireSummaryInput): number {
  let base = 14;
  base += summary.confirming * 1.5;
  base -= summary.risk * 4;
  base -= summary.watching * 0.5;
  return Math.max(0, Math.min(20, base));
}

function computeConfidenceScore(confidence?: string): number {
  const c = (confidence ?? "").toLowerCase();
  if (c === "high") return 10;
  if (c === "medium") return 7;
  return 4;
}

export function computePathIntegrity(params: ComputePathIntegrityParams): PathIntegrity {
  const { latestSnapshot, prevSnapshot, supportDelta, tripwireSummary } = params;
  const activeScenario = latestSnapshot.active_scenario;
  const align = latestSnapshot.alignment?.[activeScenario] ?? latestSnapshot.alignment?.base;

  const notes: string[] = [];

  // 1) Alignment (0–40)
  let alignmentScore = 40;
  const btcDrift = getBtcDrift(align);
  const spyDrift = getSpyDrift(align);
  const btcAbs = btcDrift != null ? Math.abs(btcDrift) : null;
  const spyAbs = spyDrift != null ? Math.abs(spyDrift) : null;

  if (align == null || (btcAbs == null && spyAbs == null)) {
    alignmentScore = 20;
    notes.push("Alignment pending/partial.");
  } else {
    if (btcAbs != null) alignmentScore -= Math.min(20, btcAbs * 5);
    if (spyAbs != null) alignmentScore -= Math.min(20, spyAbs * 5);
    alignmentScore = Math.max(0, Math.min(40, alignmentScore));

    if (align?.btc && !align.btc.inBand && btcDrift != null) {
      notes.push(`BTC out-of-band (${btcDrift >= 0 ? "+" : ""}${btcDrift.toFixed(1)}%).`);
    }
    if (align?.spy && !align.spy.inBand && spyDrift != null) {
      notes.push(`Equity out-of-band (${spyDrift >= 0 ? "+" : ""}${spyDrift.toFixed(1)}%).`);
    }
  }

  // 2) Evidence (0–30)
  const evidenceScore = Math.max(0, Math.min(30, mapSupportDeltaToEvidence(supportDelta)));
  if (supportDelta >= 0.4) {
    notes.push(`Evidence tilt supports ${activeScenario}.`);
  } else if (supportDelta >= -0.4) {
    notes.push("Evidence tilt is mixed.");
  } else {
    notes.push("Evidence tilt favors other scenario.");
  }

  // 3) Tripwires (0–20)
  const tripwireScore = computeTripwireScore(tripwireSummary);
  if (tripwireSummary.risk >= 1) {
    notes.push(`Tripwires flashing: ${tripwireSummary.risk} risk.`);
  }

  // 4) Confidence (0–10)
  const confidenceScore = computeConfidenceScore(latestSnapshot.confidence);
  if (confidenceScore <= 4) {
    notes.push("Confidence low (data thin / mixed signals).");
  }

  const score = Math.round(
    Math.max(0, Math.min(100, alignmentScore + evidenceScore + tripwireScore + confidenceScore))
  );

  let grade: PathIntegrityGrade;
  let label: string;
  if (score >= 85) {
    grade = "A";
    label = "On-path";
  } else if (score >= 70) {
    grade = "B";
    label = "Mostly on-path";
  } else if (score >= 55) {
    grade = "C";
    label = "Wobbling";
  } else if (score >= 40) {
    grade = "D";
    label = "Off-path";
  } else {
    grade = "F";
    label = "Broken trend";
  }

  let deltaWoW: number | null = null;
  if (prevSnapshot && params.prevSupportDelta != null && params.prevTripwireSummary) {
    const prevIntegrity = computePathIntegrity({
      latestSnapshot: prevSnapshot,
      supportDelta: params.prevSupportDelta,
      tripwireSummary: params.prevTripwireSummary,
    });
    deltaWoW = Math.round((score - prevIntegrity.score) * 10) / 10;
  }

  return {
    score,
    grade,
    label,
    deltaWoW,
    components: {
      alignment: Math.round(alignmentScore * 10) / 10,
      evidence: Math.round(evidenceScore * 10) / 10,
      tripwires: Math.round(tripwireScore * 10) / 10,
      confidence: confidenceScore,
    },
    notes: notes.slice(0, 5),
  };
}
