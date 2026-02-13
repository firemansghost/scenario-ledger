import { describe, it, expect } from "vitest";
import { computePathIntegrity } from "../pathIntegrity";

describe("computePathIntegrity", () => {
  it("in-band + strong positive supportDelta + no risk tripwires + high confidence -> score >= 80", () => {
    const result = computePathIntegrity({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "high",
        alignment: {
          base: {
            btc: { inBand: true },
            spy: { inBand: true },
          },
        },
      },
      supportDelta: 1.0,
      tripwireSummary: { confirming: 3, watching: 0, risk: 0 },
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.grade).toMatch(/A|B/);
    expect(result.components.alignment).toBe(40);
    expect(result.components.evidence).toBe(30);
    expect(result.components.confidence).toBe(10);
  });

  it("big drift (>=2%) + negative supportDelta + risk tripwires + low confidence -> score <= 50", () => {
    const result = computePathIntegrity({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "low",
        alignment: {
          base: {
            btc: { inBand: false, driftPct: -3.0 },
            spy: { inBand: false, driftPct: -2.5 },
          },
        },
      },
      supportDelta: -0.9,
      tripwireSummary: { confirming: 0, watching: 1, risk: 2 },
    });

    expect(result.score).toBeLessThanOrEqual(50);
    expect(result.grade).toMatch(/D|F/);
    expect(result.components.alignment).toBeLessThan(20);
    expect(result.components.evidence).toBeLessThan(15);
    expect(result.components.confidence).toBe(4);
  });

  it("missing drift/alignment -> alignment component = neutral 20 and notes include pending/partial", () => {
    const result = computePathIntegrity({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "medium",
        alignment: undefined,
      },
      supportDelta: 0,
      tripwireSummary: { confirming: 0, watching: 0, risk: 0 },
    });

    expect(result.components.alignment).toBe(20);
    expect(result.notes.some((n) => n.toLowerCase().includes("pending") || n.toLowerCase().includes("partial"))).toBe(
      true
    );
  });

  it("computes deltaWoW when prevSnapshot and prev metrics provided", () => {
    const result = computePathIntegrity({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "high",
        alignment: { base: { btc: { inBand: true }, spy: { inBand: true } } },
      },
      prevSnapshot: {
        week_ending: "2026-02-01",
        active_scenario: "base",
        confidence: "medium",
        alignment: { base: { btc: { inBand: false, driftPct: -2 }, spy: { inBand: true } } },
      },
      supportDelta: 0.5,
      tripwireSummary: { confirming: 2, watching: 0, risk: 0 },
      prevSupportDelta: 0.2,
      prevTripwireSummary: { confirming: 1, watching: 1, risk: 0 },
    });

    expect(result.deltaWoW).not.toBeNull();
    expect(typeof result.deltaWoW).toBe("number");
  });
});
