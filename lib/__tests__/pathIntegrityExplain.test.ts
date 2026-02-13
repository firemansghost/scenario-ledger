import { describe, it, expect } from "vitest";
import { buildPathIntegrityExplain } from "../pathIntegrityExplain";

describe("buildPathIntegrityExplain", () => {
  it("when drift missing -> explanation contains 'pending'", () => {
    const explain = buildPathIntegrityExplain({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "high",
        alignment: undefined,
      },
      integrity: {
        score: 75,
        grade: "B",
        label: "Mostly on-path",
        deltaWoW: null,
        components: { alignment: 20, evidence: 24, tripwires: 14, confidence: 10 },
        notes: [],
      },
      supportDelta: 0.5,
      tripwireSummary: { confirming: 2, watching: 0, risk: 0 },
      scenarioLabel: "Base",
    });

    const alignmentSection = explain.sections.find((s) => s.title.includes("Alignment"));
    expect(alignmentSection).toBeDefined();
    expect(alignmentSection!.lines.some((l) => l.toLowerCase().includes("pending"))).toBe(true);
  });

  it("when supportDelta negative -> explanation includes 'leans away'", () => {
    const explain = buildPathIntegrityExplain({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "medium",
        alignment: {
          base: { btc: { inBand: true }, spy: { inBand: true } },
        },
      },
      integrity: {
        score: 55,
        grade: "C",
        label: "Wobbling",
        deltaWoW: null,
        components: { alignment: 40, evidence: 12, tripwires: 14, confidence: 7 },
        notes: [],
      },
      supportDelta: -0.6,
      tripwireSummary: { confirming: 0, watching: 2, risk: 0 },
      scenarioLabel: "Base",
    });

    const evidenceSection = explain.sections.find((s) => s.title.includes("Evidence"));
    expect(evidenceSection).toBeDefined();
    expect(evidenceSection!.lines.some((l) => l.toLowerCase().includes("leans away") || l.toLowerCase().includes("negative"))).toBe(true);
  });

  it("'What changes it' includes drift bullet when drift >= 2", () => {
    const explain = buildPathIntegrityExplain({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        confidence: "low",
        alignment: {
          base: {
            btc: { inBand: false, driftPct: -2.5 },
            spy: { inBand: false, driftPct: -2.1 },
          },
        },
      },
      integrity: {
        score: 35,
        grade: "F",
        label: "Broken trend",
        deltaWoW: null,
        components: { alignment: 5, evidence: 6, tripwires: 10, confidence: 4 },
        notes: [],
      },
      supportDelta: -0.9,
      tripwireSummary: { confirming: 0, watching: 1, risk: 2 },
      scenarioLabel: "Base",
    });

    expect(explain.whatChangesIt.some((b) => b.includes("≥2%") || b.includes("2%"))).toBe(true);
  });
});
