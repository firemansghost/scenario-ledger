import { approxSpyBandFromSpxBand } from "./equityProxy";
import type { AlignmentResult, ForecastConfig, ScenarioKey, ScenarioAlignment } from "./types";

function findPeriod(config: ForecastConfig, scenario: ScenarioKey, weekEnding: string) {
  const sc = config.scenarios[scenario];
  if (!sc) return null;
  const we = new Date(weekEnding).getTime();
  for (const p of sc.periods) {
    const start = new Date(p.start).getTime();
    const end = new Date(p.end).getTime();
    if (we >= start && we <= end) return p;
  }
  return null;
}

function inBand(value: number, low: number, high: number) {
  const mid = (low + high) / 2;
  const conservative = value >= low;
  const stretch = value <= high;
  const midIn = value >= Math.min(mid, low) && value <= Math.max(mid, high);
  const inBandResult = value >= low && value <= high;
  let driftPct: number;
  if (inBandResult) {
    driftPct = 0;
  } else {
    if (value < low) driftPct = ((value - low) / low) * 100;
    else driftPct = ((value - high) / high) * 100;
  }
  return {
    inBand: inBandResult,
    conservative,
    mid: midIn,
    stretch,
    driftPct,
  };
}

export interface AlignmentInput {
  config: ForecastConfig;
  weekEnding: string;
  btcClose: number | null;
  spyClose: number | null;
  /** Per-snapshot factor (spy_close / spx_close). If null, falls back to meta.spxToSpyFactor or skips equity alignment. */
  spxFactor: number | null;
}

export interface AlignmentOutput {
  alignment: AlignmentResult;
  spx_factor: number | null;
  spx_equiv: number | null;
}

export function computeAlignment(input: AlignmentInput): AlignmentOutput {
  const { config, weekEnding, btcClose, spyClose, spxFactor } = input;
  const factor = spxFactor ?? config.meta?.spxToSpyFactor ?? null;
  const spx_equiv = spyClose != null && factor != null && factor > 0 ? spyClose / factor : null;

  const alignment: AlignmentResult = {} as AlignmentResult;

  for (const scenario of ["bull", "base", "bear"] as ScenarioKey[]) {
    const period = findPeriod(config, scenario, weekEnding);
    const result: ScenarioAlignment = {
      btc: { inBand: false, conservative: false, mid: false, stretch: false },
      spy: { inBand: false, conservative: false, mid: false, stretch: false },
    };
    if (period) {
      result.periodLabel = period.label;
      result.spxRange = period.spxRange;
      const spyBand =
        factor != null && period.spxRange
          ? approxSpyBandFromSpxBand(period.spxRange, factor)
          : period.spyRangeApprox ?? null;
      result.spyRangeApprox = spyBand ?? undefined;
      if (btcClose != null) {
        result.btc = {
          ...inBand(btcClose, period.btcRangeUsd.low, period.btcRangeUsd.high),
        };
      }
      if (spyClose != null && spyBand) {
        result.spy = {
          ...inBand(spyClose, spyBand.low, spyBand.high),
        };
      }
    }
    alignment[scenario] = result;
  }

  return { alignment, spx_factor: factor, spx_equiv };
}
