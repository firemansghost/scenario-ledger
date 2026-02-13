import { describe, it, expect } from "vitest";
import { scoreTripwires, summarizeTripwires } from "../tripwireStatus";

describe("scoreTripwires", () => {
  it("in-band + supportDelta positive -> checkpoints confirming, invalidations watching/confirming", () => {
    const results = scoreTripwires({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        alignment: {
          base: {
            btc: { inBand: true },
            spy: { inBand: true },
          },
        },
      },
      latestIndicators: [
        { indicator_key: "a", state: "bullish", value: 1, delta: 0.1 },
        { indicator_key: "b", state: "bullish", value: 1, delta: 0.05 },
        { indicator_key: "c", state: "neutral", value: 0, delta: 0 },
      ],
      defsByKey: {
        a: { name: "A", weights: { bullish: { base: 0.5 }, neutral: {}, bearish: {} } },
        b: { name: "B", weights: { bullish: { base: 0.4 }, neutral: {}, bearish: {} } },
        c: { name: "C", weights: { neutral: { base: 0.1 }, bullish: {}, bearish: {} } },
      },
      scenarioConfig: {
        checkpoints: ["Checkpoint 1"],
        invalidations: ["Invalidation 1"],
      },
    });

    const cp = results.find((r) => r.kind === "checkpoint");
    const inv = results.find((r) => r.kind === "invalidation");

    expect(cp?.status).toBe("confirming");
    expect(inv?.status).toMatch(/confirming|watching/);
  });

  it("big drift + supportDelta negative -> invalidations risk", () => {
    const results = scoreTripwires({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        alignment: {
          base: {
            btc: { inBand: false, driftPct: -3.5 },
            spy: { inBand: false, driftPct: -2.1 },
          },
        },
      },
      latestIndicators: [
        { indicator_key: "a", state: "bearish", value: -1, delta: -0.2 },
        { indicator_key: "b", state: "bearish", value: -1, delta: -0.1 },
      ],
      defsByKey: {
        a: { name: "A", weights: { bearish: { base: -0.5, bull: 0.3 }, neutral: {}, bullish: {} } },
        b: { name: "B", weights: { bearish: { base: -0.4, bull: 0.2 }, neutral: {}, bullish: {} } },
      },
      scenarioConfig: {
        checkpoints: ["Checkpoint 1"],
        invalidations: ["Invalidation 1"],
      },
    });

    const cp = results.find((r) => r.kind === "checkpoint");
    const inv = results.find((r) => r.kind === "invalidation");

    expect(cp?.status).toBe("risk");
    expect(inv?.status).toBe("risk");
  });

  it("missing snapshot -> all unknown", () => {
    const results = scoreTripwires({
      latestSnapshot: null,
      latestIndicators: [],
      defsByKey: {},
      scenarioConfig: {
        checkpoints: ["C1"],
        invalidations: ["I1"],
      },
    });

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.status === "unknown")).toBe(true);
  });
});

describe("summarizeTripwires", () => {
  it("counts confirming, watching, risk", () => {
    const results = [
      { kind: "checkpoint" as const, text: "C1", status: "confirming" as const, reason: "" },
      { kind: "checkpoint" as const, text: "C2", status: "confirming" as const, reason: "" },
      { kind: "invalidation" as const, text: "I1", status: "watching" as const, reason: "" },
      { kind: "invalidation" as const, text: "I2", status: "risk" as const, reason: "" },
    ];
    const summary = summarizeTripwires(results);
    expect(summary.confirming).toBe(2);
    expect(summary.watching).toBe(1);
    expect(summary.risk).toBe(1);
  });
});
