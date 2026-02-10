import { describe, it, expect } from "vitest";
import { computeAlignment } from "../alignment";
import type { ForecastConfig } from "../types";

const mockConfig: ForecastConfig = {
  meta: { spxToSpyFactor: 0.1 },
  scenarios: {
    base: {
      label: "Base",
      drivers: [],
      periods: [
        {
          start: "2026-02-08",
          end: "2026-12-31",
          btcRangeUsd: { low: 55000, high: 90000 },
          spxRange: { low: 5700, high: 7600 },
          spyRangeApprox: { low: 570, high: 760 },
        },
      ],
      checkpoints: [],
      invalidations: [],
    },
    bull: {
      label: "Bull",
      drivers: [],
      periods: [
        {
          start: "2026-02-08",
          end: "2026-12-31",
          btcRangeUsd: { low: 65000, high: 110000 },
          spxRange: { low: 6500, high: 8000 },
          spyRangeApprox: { low: 650, high: 800 },
        },
      ],
      checkpoints: [],
      invalidations: [],
    },
    bear: {
      label: "Bear",
      drivers: [],
      periods: [
        {
          start: "2026-02-08",
          end: "2026-12-31",
          btcRangeUsd: { low: 35000, high: 70000 },
          spxRange: { low: 4900, high: 6500 },
          spyRangeApprox: { low: 490, high: 650 },
        },
      ],
      checkpoints: [],
      invalidations: [],
    },
  },
};

describe("computeAlignment", () => {
  it("marks BTC/SPY in band when within range", () => {
    const { alignment, spx_equiv } = computeAlignment({
      config: mockConfig,
      weekEnding: "2026-03-14",
      btcClose: 70000,
      spyClose: 600,
    });
    expect(spx_equiv).toBe(6000);
    expect(alignment.base.btc.inBand).toBe(true);
    expect(alignment.base.spy.inBand).toBe(true);
  });

  it("marks SPY out of band when below low", () => {
    const { alignment } = computeAlignment({
      config: mockConfig,
      weekEnding: "2026-03-14",
      btcClose: null,
      spyClose: 500,
    });
    expect(alignment.base.spy.inBand).toBe(false);
    expect(alignment.base.spy.driftPct).toBeDefined();
  });
});
