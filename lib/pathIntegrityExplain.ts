/**
 * Explainability for Path Integrity Score.
 * Generates human-readable breakdown and "what would change it" bullets.
 */

import type { PathIntegrity } from "./pathIntegrity";
import type { ScenarioKey } from "./types";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

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

export interface PathIntegrityExplain {
  headline: string;
  sections: {
    title: string;
    lines: string[];
    points?: string;
  }[];
  whatChangesIt: string[];
  disclaimers: string[];
}

export interface BuildPathIntegrityExplainParams {
  latestSnapshot: SnapshotInput;
  prevSnapshot?: SnapshotInput | null;
  integrity: PathIntegrity;
  supportDelta: number;
  tripwireSummary: TripwireSummaryInput;
  scenarioLabel: string;
  factor?: number | null;
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

export function buildPathIntegrityExplain(params: BuildPathIntegrityExplainParams): PathIntegrityExplain {
  const { latestSnapshot, integrity, supportDelta, tripwireSummary, scenarioLabel } = params;
  const activeScenario = latestSnapshot.active_scenario;
  const align = latestSnapshot.alignment?.[activeScenario] ?? latestSnapshot.alignment?.base;

  const btcDrift = getBtcDrift(align);
  const spyDrift = getSpyDrift(align);
  const btcAbs = btcDrift != null ? Math.abs(btcDrift) : 0;
  const spyAbs = spyDrift != null ? Math.abs(spyDrift) : 0;
  const hasBigDrift = btcAbs >= 2 || spyAbs >= 2;
  const confidence = (latestSnapshot.confidence ?? "").toLowerCase();

  // 1) Headline
  let headline: string;
  if (integrity.grade === "A" || integrity.grade === "B") {
    headline = `Mostly on-path: price is behaving inside the published bands and evidence still leans ${scenarioLabel}.`;
  } else if (integrity.grade === "C") {
    headline =
      "Wobbling: still roughly on-path, but drift/evidence is starting to lean the other way.";
  } else {
    headline =
      "Off-path: price/evidence is breaking away from what this read expects.";
  }

  // 2) Sections
  const alignmentLines: string[] = [];
  alignmentLines.push(
    btcDrift != null
      ? `BTC drift: ${btcDrift.toFixed(1)}% (0% means in-band)`
      : "BTC drift: pending"
  );
  alignmentLines.push(
    spyDrift != null
      ? `Equity drift: ${spyDrift.toFixed(1)}% (0% means in-band)`
      : "Equity drift: pending"
  );
  alignmentLines.push(
    "Drift is % outside nearest edge. In-band is always 0%."
  );
  if (align?.btc && !align.btc.inBand) {
    alignmentLines.push(
      "Out-of-band means outside nearest edge, not 'wrong' — it means the scenario isn't being respected this week."
    );
  } else if (align?.spy && !align.spy.inBand) {
    alignmentLines.push(
      "Out-of-band means outside nearest edge, not 'wrong' — it means the scenario isn't being respected this week."
    );
  }

  const evidenceLines: string[] = [];
  const sdFormatted = supportDelta >= 0 ? `+${supportDelta.toFixed(2)}` : supportDelta.toFixed(2);
  evidenceLines.push(
    `supportDelta: ${sdFormatted} (positive supports the read; negative leans away)`
  );
  evidenceLines.push(
    "Positive = evidence supports the current read. Negative = evidence is leaning away."
  );

  const tripwireLines: string[] = [];
  tripwireLines.push(
    `Confirming: ${tripwireSummary.confirming} · Watching: ${tripwireSummary.watching} · Risk: ${tripwireSummary.risk}`
  );
  tripwireLines.push("Confirming helps a little; Risk hurts a lot.");

  const confidenceLines: string[] = [];
  const confLabel = confidence === "high" ? "high" : confidence === "medium" ? "medium" : "low";
  confidenceLines.push(`Confidence: ${confLabel}`);
  confidenceLines.push(
    "Confidence reflects data completeness + agreement (not conviction)."
  );

  const sections = [
    {
      title: "Alignment (0–40)",
      lines: alignmentLines,
      points: `${Math.round(integrity.components.alignment)}/40`,
    },
    {
      title: "Evidence tilt (0–30)",
      lines: evidenceLines,
      points: `${Math.round(integrity.components.evidence)}/30`,
    },
    {
      title: "Tripwires (0–20)",
      lines: tripwireLines,
      points: `${Math.round(integrity.components.tripwires)}/20`,
    },
    {
      title: "Confidence (0–10)",
      lines: confidenceLines,
      points: `${integrity.components.confidence}/10`,
    },
  ];

  // 3) What changes it
  const whatChangesIt: string[] = [];
  if (btcDrift != null && spyDrift != null && (btcAbs > 0 || spyAbs > 0)) {
    whatChangesIt.push(
      "Alignment improves fast if BTC and/or Equity move back inside the band (drift → 0%)."
    );
  }
  if (hasBigDrift) {
    whatChangesIt.push(
      "Big drifts (≥2%) are heavy weights — they can swing the score even if evidence stays supportive."
    );
  }
  if (supportDelta < 0) {
    whatChangesIt.push(
      "Evidence score improves if the evidence tilt turns positive (supportDelta above 0)."
    );
  }
  if (tripwireSummary.risk >= 1) {
    whatChangesIt.push(
      "Tripwire risk counts are expensive — clearing risk signals boosts score quickly."
    );
  }
  if (confidence === "low") {
    whatChangesIt.push(
      "Confidence rises when more indicators report cleanly and stop disagreeing."
    );
  }
  if (supportDelta >= 0.4 && (btcAbs > 0 || spyAbs > 0)) {
    whatChangesIt.push(
      "Alignment is the main lever when drift is present — getting back in-band helps most."
    );
  }
  if (whatChangesIt.length < 3) {
    whatChangesIt.push(
      "Score stays high when all four components stay aligned."
    );
  }

  return {
    headline,
    sections,
    whatChangesIt: whatChangesIt.slice(0, 6),
    disclaimers: [
      "This measures consistency with the published bands + evidence. It does not predict price.",
      "Out-of-band ≠ wrong. It means the scenario isn't being respected this week.",
    ],
  };
}
