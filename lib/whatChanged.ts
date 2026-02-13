/**
 * Build "What changed since last week" bullets for Forecast Brief.
 */

import { prettifyKey } from "./format";
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

type IndicatorRow = {
  indicator_key: string;
  state: string;
  delta: number | null;
};

function formatDrift(inBand: boolean, driftPct?: number): string {
  if (inBand) return "In (0.0%)";
  if (driftPct != null) {
    const sign = driftPct >= 0 ? "+" : "";
    return `Out (${sign}${driftPct.toFixed(1)}%)`;
  }
  return "—";
}

export function buildWhatChangedBullets(params: {
  latestSnapshot: SnapshotInput;
  prevSnapshot: SnapshotInput | null;
  indicatorLatest: IndicatorRow[];
  indicatorPrev: IndicatorRow[];
  defsByKey: Record<string, string>;
}): string[] {
  const { latestSnapshot, prevSnapshot, indicatorLatest, indicatorPrev, defsByKey } = params;
  const bullets: string[] = [];

  if (!prevSnapshot) {
    return ["First snapshot. Next week we'll show what changed."];
  }

  const activeScenario = latestSnapshot.active_scenario;
  const prevScenario = prevSnapshot.active_scenario;
  const align = latestSnapshot.alignment?.[activeScenario] ?? latestSnapshot.alignment?.base;
  const prevAlign = prevSnapshot.alignment?.[activeScenario] ?? prevSnapshot.alignment?.base;

  if (prevScenario !== activeScenario) {
    bullets.push(
      `Read: flipped ${prevScenario.charAt(0).toUpperCase() + prevScenario.slice(1)} → ${activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)}`
    );
  } else {
    bullets.push(`Read: stayed ${activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)}`);
  }

  if (align?.btc != null && prevAlign?.btc != null && align?.spy != null && prevAlign?.spy != null) {
    const btcNow = align.btc.inBand ? 0 : Math.abs(align.btc.driftPct ?? 0);
    const btcPrev = prevAlign.btc.inBand ? 0 : Math.abs(prevAlign.btc.driftPct ?? 0);
    const spyNow = align.spy.inBand ? 0 : Math.abs(align.spy.driftPct ?? 0);
    const spyPrev = prevAlign.spy.inBand ? 0 : Math.abs(prevAlign.spy.driftPct ?? 0);
    const improved = btcNow < btcPrev || spyNow < spyPrev;
    const worsened = btcNow > btcPrev || spyNow > spyPrev;
    if (improved && !worsened) {
      bullets.push(
        `Alignment: improved (BTC ${formatDrift(align.btc.inBand, align.btc.driftPct)} · Equity ${formatDrift(align.spy.inBand, align.spy.driftPct)})`
      );
    } else if (worsened && !improved) {
      bullets.push(
        `Alignment: worsened (BTC ${formatDrift(align.btc.inBand, align.btc.driftPct)} · Equity ${formatDrift(align.spy.inBand, align.spy.driftPct)})`
      );
    } else if (improved || worsened) {
      bullets.push(
        `Alignment: BTC ${formatDrift(align.btc.inBand, align.btc.driftPct)} · Equity ${formatDrift(align.spy.inBand, align.spy.driftPct)}`
      );
    }
  }

  if (indicatorLatest.length > 0 && indicatorPrev.length > 0) {
    const prevByKey = Object.fromEntries(indicatorPrev.map((r) => [r.indicator_key, r]));
    let biggestMover: { name: string; state: string; score: number } | null = null;
    for (const row of indicatorLatest) {
      const prev = prevByKey[row.indicator_key];
      const score =
        row.delta != null
          ? Math.abs(row.delta)
          : prev && prev.state !== row.state
            ? 1
            : 0;
      const name = defsByKey[row.indicator_key]?.trim() || prettifyKey(row.indicator_key);
      if (!biggestMover || score > biggestMover.score) {
        biggestMover = { name, state: row.state, score };
      }
    }
    if (biggestMover && biggestMover.score > 0) {
      bullets.push(`Evidence: biggest mover was ${biggestMover.name} (${biggestMover.state})`);
    }
  }

  return bullets.slice(0, 3);
}
