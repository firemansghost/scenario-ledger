import { getSpxEquiv } from "./spxEquiv";
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
  let driftPct: number | undefined;
  if (!inBandResult) {
    if (value < low) driftPct = ((low - value) / low) * 100;
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
}

export interface AlignmentOutput {
  alignment: AlignmentResult;
  spx_factor: number;
  spx_equiv: number | null;
}

export function computeAlignment(input: AlignmentInput): AlignmentOutput {
  const { config, weekEnding, btcClose, spyClose } = input;
  const factor = config.meta?.spxToSpyFactor ?? 0.1;
  const spx_equiv = spyClose != null ? getSpxEquiv(spyClose, factor) : null;

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
      result.spyRangeApprox = period.spyRangeApprox;
      if (btcClose != null) {
        result.btc = {
          ...inBand(btcClose, period.btcRangeUsd.low, period.btcRangeUsd.high),
        };
      }
      if (spyClose != null && period.spyRangeApprox) {
        result.spy = {
          ...inBand(spyClose, period.spyRangeApprox.low, period.spyRangeApprox.high),
        };
      }
    }
    alignment[scenario] = result;
  }

  return { alignment, spx_factor: factor, spx_equiv };
}
