import type { ScenarioKey } from "./types";

type AlignRow = {
  btc?: { inBand: boolean; driftPct?: number };
  spy?: { inBand: boolean; driftPct?: number };
};

type SnapshotInput = {
  week_ending: string;
  active_scenario: ScenarioKey;
  confidence: string;
  scenario_probs: Record<ScenarioKey, number>;
  alignment?: Record<string, AlignRow | undefined>;
  top_contributors?: { indicator_key: string; contribution: number }[];
};

type IndicatorRow = {
  indicator_key: string;
  value: number | null;
  delta: number | null;
  state: string;
};

type DefMap = Record<string, string>;

export interface WeeklyBriefResult {
  title: string;
  subtitle: string;
  headline: string;
  bullets: string[];
  stats: {
    scenarioLabel: string;
    probDeltas: { bull: number; base: number; bear: number };
    btcStatus?: string;
    eqStatus?: string;
  };
  ctas: {
    primaryHref: string;
    secondaryHref: string;
  };
}

function formatDrift(inBand: boolean, driftPct?: number): string {
  if (inBand) return "In (0.0%)";
  if (driftPct != null) {
    const sign = driftPct >= 0 ? "+" : "";
    return `Out (${sign}${driftPct.toFixed(1)}%)`;
  }
  return "—";
}

function getDrift(align: AlignRow | undefined, key: "btc" | "spy"): number {
  const cell = align?.[key];
  if (!cell) return 0;
  if (cell.inBand) return 0;
  return cell.driftPct ?? 0;
}

export function buildWeeklyBrief(params: {
  latestSnapshot: SnapshotInput;
  prevSnapshot: SnapshotInput | null;
  indicatorLatest?: IndicatorRow[];
  indicatorPrev?: IndicatorRow[];
  defsByKey?: DefMap;
  scenarioConfig?: { checkpoints: string[]; invalidations: string[] };
}): WeeklyBriefResult {
  const {
    latestSnapshot,
    prevSnapshot,
    indicatorLatest = [],
    indicatorPrev = [],
    defsByKey = {},
    scenarioConfig,
  } = params;

  const activeScenario = latestSnapshot.active_scenario;
  const prevScenario = prevSnapshot?.active_scenario;
  const align = latestSnapshot.alignment?.[activeScenario] ?? latestSnapshot.alignment?.["base"];
  const prevAlign = prevSnapshot?.alignment?.[activeScenario] ?? prevSnapshot?.alignment?.["base"];

  const scenarioLabel =
    `${activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)} (${latestSnapshot.confidence})`;

  const probDeltas = {
    bull: 0,
    base: 0,
    bear: 0,
  };
  if (prevSnapshot) {
    const keys: ScenarioKey[] = ["bull", "base", "bear"];
    for (const k of keys) {
      const latest = (latestSnapshot.scenario_probs ?? {})[k] ?? 0;
      const prev = (prevSnapshot.scenario_probs ?? {})[k] ?? 0;
      probDeltas[k] = Number(((latest - prev) * 100).toFixed(1));
    }
  }

  const btcStatus = align?.btc != null ? formatDrift(align.btc.inBand, align.btc.driftPct) : undefined;
  const eqStatus = align?.spy != null ? formatDrift(align.spy.inBand, align.spy.driftPct) : undefined;

  let headline: string;
  const bullets: string[] = [];

  if (!prevSnapshot) {
    headline = "First snapshot logged. Next week we'll show deltas.";
  } else {
    if (prevScenario !== activeScenario) {
      headline = `Read flipped ${prevScenario?.charAt(0).toUpperCase() ?? ""}${prevScenario?.slice(1) ?? ""} → ${activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)} as credit/vol signals shifted.`;
    } else {
      headline = `Read stayed ${activeScenario.charAt(0).toUpperCase() + activeScenario.slice(1)}. Drift + probs moved.`;
    }

    const btcDrift = getDrift(align, "btc");
    const prevBtcDrift = getDrift(prevAlign, "btc");
    const spyDrift = getDrift(align, "spy");
    const prevSpyDrift = getDrift(prevAlign, "spy");

    if (align?.btc != null && prevAlign?.btc != null) {
      const btcAbs = Math.abs(btcDrift);
      const prevBtcAbs = Math.abs(prevBtcDrift);
      if (btcAbs < prevBtcAbs) {
        bullets.push(`BTC drift improved: ${formatDrift(prevAlign.btc.inBand, prevAlign.btc.driftPct)} → ${formatDrift(align.btc.inBand, align.btc.driftPct)}.`);
      } else if (btcAbs > prevBtcAbs && btcAbs > 0) {
        bullets.push(`BTC drift worsened: ${formatDrift(prevAlign.btc.inBand, prevAlign.btc.driftPct)} → ${formatDrift(align.btc.inBand, align.btc.driftPct)}.`);
      }
    }

    if (align?.spy != null && prevAlign?.spy != null) {
      const spyAbs = Math.abs(spyDrift);
      const prevSpyAbs = Math.abs(prevSpyDrift);
      if (spyAbs < prevSpyAbs) {
        bullets.push(`Equity drift improved: ${formatDrift(prevAlign.spy.inBand, prevAlign.spy.driftPct)} → ${formatDrift(align.spy.inBand, align.spy.driftPct)}.`);
      } else if (spyAbs > prevSpyAbs && spyAbs > 0) {
        bullets.push(`Equity drift worsened: ${formatDrift(prevAlign.spy.inBand, prevAlign.spy.driftPct)} → ${formatDrift(align.spy.inBand, align.spy.driftPct)}.`);
      }
    }

    if (indicatorLatest.length > 0 && indicatorPrev.length > 0) {
      const prevByKey = Object.fromEntries(indicatorPrev.map((r) => [r.indicator_key, r]));
      const movers: string[] = [];
      for (const row of indicatorLatest) {
        const prev = prevByKey[row.indicator_key];
        if (!prev) continue;
        const name = defsByKey[row.indicator_key] ?? row.indicator_key.replace(/_/g, " ");
        if (prev.state !== row.state) {
          movers.push(`${name}: ${prev.state} → ${row.state}`);
        } else if (row.delta != null && Math.abs(row.delta) > 0.01) {
          movers.push(`${name}: delta ${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}, stayed ${row.state}`);
        }
      }
      if (movers.length > 0) {
        bullets.push(movers.slice(0, 3).join(" | "));
      }
    } else if ((latestSnapshot.top_contributors ?? []).length > 0) {
      const top = (latestSnapshot.top_contributors ?? [])
        .slice(0, 3)
        .map((c) => defsByKey[c.indicator_key] ?? c.indicator_key.replace(/_/g, " "))
        .join(", ");
      bullets.push(`Top pushes: ${top}.`);
    }

    if (scenarioConfig && (scenarioConfig.checkpoints?.length > 0 || scenarioConfig.invalidations?.length > 0)) {
      const cp = (scenarioConfig.checkpoints ?? []).slice(0, 2).join("; ");
      const inv = (scenarioConfig.invalidations ?? []).slice(0, 1)[0] ?? "";
      const parts: string[] = [];
      if (cp) parts.push(`Watch: ${cp}`);
      if (inv) parts.push(`Invalidation: ${inv}`);
      if (parts.length > 0) bullets.push(parts.join(". "));
    }
  }

  return {
    title: "Weekly Brief",
    subtitle: prevSnapshot
      ? `Week ending ${latestSnapshot.week_ending} · vs ${prevSnapshot.week_ending}`
      : `Week ending ${latestSnapshot.week_ending}`,
    headline,
    bullets: bullets.slice(0, 3),
    stats: {
      scenarioLabel,
      probDeltas,
      btcStatus,
      eqStatus,
    },
    ctas: {
      primaryHref: "/predictions#this-week",
      secondaryHref: "/alignment",
    },
  };
}
