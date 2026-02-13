/**
 * Weekly Playbook: what to watch, what would change the read.
 * Synthesizes tripwires + alignment + evidence + integrity.
 */

import { stableKeyFromText } from "./hash";
import type { PathIntegrity } from "./pathIntegrity";
import type { TripwireResult } from "./tripwireStatus";
import type { ScenarioKey } from "./types";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

type SnapshotInput = {
  week_ending: string;
  active_scenario: ScenarioKey;
  alignment?: Record<string, AlignRow | undefined>;
};

export type PlaybookItemKind = "checkpoint" | "invalidation";
export type PlaybookItemStatus = "confirming" | "watching" | "risk" | "unknown";

export interface PlaybookItem {
  kind: PlaybookItemKind;
  status: PlaybookItemStatus;
  text: string;
  reason?: string;
  evidence?: string[];
  key: string;
}

export interface WeeklyPlaybook {
  title: string;
  subtitle: string;
  headline: string;
  sections: {
    confirming: PlaybookItem[];
    watching: PlaybookItem[];
    risk: PlaybookItem[];
    unknown: PlaybookItem[];
  };
  flipTriggers: string[];
  checkNextWeek: string[];
  disclaimers: string[];
}

type ScenarioConfigInput = {
  checkpoints: string[];
  invalidations: string[];
};

type TripwireSummaryInput = {
  confirming: number;
  watching: number;
  risk: number;
};

export interface BuildWeeklyPlaybookParams {
  latestSnapshot: SnapshotInput;
  prevSnapshot?: SnapshotInput | null;
  scenarioConfig: ScenarioConfigInput;
  tripwireResults?: TripwireResult[];
  tripwireSummary?: TripwireSummaryInput;
  supportDelta: number;
  integrity: PathIntegrity;
  integrityTrend?: number[];
  btcDrift?: number | null;
  eqDrift?: number | null;
}

function tripwireToPlaybookItem(r: TripwireResult): PlaybookItem {
  const key = `${r.kind}:${stableKeyFromText(r.text)}`;
  return {
    kind: r.kind,
    status: r.status,
    text: r.text,
    reason: r.reason,
    evidence: r.evidence?.slice(0, 2),
    key,
  };
}

function fallbackItems(scenarioConfig: ScenarioConfigInput): PlaybookItem[] {
  const items: PlaybookItem[] = [];
  for (const c of scenarioConfig.checkpoints) {
    items.push({
      kind: "checkpoint",
      status: "unknown",
      text: c,
      key: `checkpoint:${stableKeyFromText(c)}`,
    });
  }
  for (const inv of scenarioConfig.invalidations) {
    items.push({
      kind: "invalidation",
      status: "unknown",
      text: inv,
      key: `invalidation:${stableKeyFromText(inv)}`,
    });
  }
  return items;
}

export function buildWeeklyPlaybook(params: BuildWeeklyPlaybookParams): WeeklyPlaybook {
  const {
    latestSnapshot,
    integrity,
    scenarioConfig,
    tripwireResults,
    tripwireSummary,
    supportDelta,
    btcDrift = null,
    eqDrift = null,
  } = params;

  const deltaWoW = integrity.deltaWoW ?? 0;
  const btcAbs = btcDrift != null ? Math.abs(btcDrift) : 0;
  const eqAbs = eqDrift != null ? Math.abs(eqDrift) : 0;
  const hasBigDrift = btcAbs >= 2 || eqAbs >= 2;
  const bothInBand = btcDrift === 0 && eqDrift === 0;

  // 1) Headline
  let headline: string;
  if (integrity.grade === "D" || integrity.grade === "F") {
    headline = "Off-path. Something is breaking versus the published bands.";
  } else if (integrity.grade === "C" || deltaWoW <= -6) {
    headline = "Wobbling. The read still fits, but the tape is arguing.";
  } else {
    headline = "Mostly on-path. The read is holding.";
  }

  // 2) Items from tripwireResults or fallback
  const items: PlaybookItem[] = tripwireResults?.length
    ? tripwireResults.map(tripwireToPlaybookItem)
    : fallbackItems(scenarioConfig);

  // Prioritize: risk invalidations > watching invalidations > watching checkpoints > confirming checkpoints > unknown
  const byStatus = {
    confirming: items.filter((i) => i.status === "confirming"),
    watching: items.filter((i) => i.status === "watching"),
    risk: items.filter((i) => i.status === "risk"),
    unknown: items.filter((i) => i.status === "unknown"),
  };

  const sections = {
    confirming: byStatus.confirming.slice(0, 2),
    watching: byStatus.watching.slice(0, 3),
    risk: byStatus.risk.slice(0, 3),
    unknown: byStatus.unknown.slice(0, 2),
  };

  // 3) Flip triggers
  const flipTriggers: string[] = [];
  if (hasBigDrift) {
    flipTriggers.push(
      "Big drift (≥2%) is expensive. If it persists, integrity usually bleeds."
    );
  }
  if (bothInBand) {
    flipTriggers.push(
      "In-band (0% drift) stabilizes the read fast. Out-of-band is where flips start."
    );
  }
  if (supportDelta < 0) {
    flipTriggers.push(
      "If evidence tilt stays negative (supportDelta < 0), expect pressure on the current read."
    );
  }
  if ((tripwireSummary?.risk ?? 0) > 0) {
    flipTriggers.push(
      "Risk tripwires are the fastest way to force a re-read. Clearing them is priority."
    );
  }
  if (deltaWoW <= -10) {
    flipTriggers.push(
      "A double-digit integrity drop week-over-week is your 'stop ignoring this' moment."
    );
  }
  if (flipTriggers.length < 3) {
    flipTriggers.push(
      "Watch drift, evidence tilt, and tripwire risk. Any sharp move can shift the read."
    );
  }

  // 4) Check next week (exactly 3)
  const checkNextWeek = [
    "1) Drift: did BTC and Equity stay in-band (0%)?",
    "2) Evidence tilt: did supportDelta move toward/above 0?",
    "3) Tripwires: did Risk count shrink or grow?",
  ];

  // 5) Disclaimers
  const disclaimers = [
    "Heuristic. Not auto-verified.",
    "Checklist behavior, not trade signals.",
  ];

  return {
    title: "Playbook",
    subtitle: "What would change the read next week.",
    headline,
    sections,
    flipTriggers: flipTriggers.slice(0, 5),
    checkNextWeek,
    disclaimers,
  };
}
