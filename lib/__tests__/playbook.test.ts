import { describe, it, expect } from "vitest";
import { buildWeeklyPlaybook } from "../playbook";

const baseIntegrity = {
  score: 75,
  grade: "B",
  label: "Mostly on-path",
  deltaWoW: null,
  components: { alignment: 30, evidence: 20, tripwires: 15, confidence: 10 },
  notes: [],
};

describe("buildWeeklyPlaybook", () => {
  it("risk invalidations are prioritized above watching checkpoints", () => {
    const playbook = buildWeeklyPlaybook({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        alignment: { base: { btc: { inBand: true }, spy: { inBand: true } } },
      },
      scenarioConfig: {
        checkpoints: ["Checkpoint A", "Checkpoint B"],
        invalidations: ["Invalidation X", "Invalidation Y"],
      },
      tripwireResults: [
        { kind: "checkpoint", text: "Checkpoint A", status: "watching", reason: "Mixed" },
        { kind: "checkpoint", text: "Checkpoint B", status: "confirming", reason: "OK" },
        { kind: "invalidation", text: "Invalidation X", status: "risk", reason: "Drift" },
        { kind: "invalidation", text: "Invalidation Y", status: "watching", reason: "Watching" },
      ],
      tripwireSummary: { confirming: 1, watching: 2, risk: 1 },
      supportDelta: 0.3,
      integrity: baseIntegrity,
      btcDrift: 0,
      eqDrift: 0,
    });

    expect(playbook.sections.risk.length).toBeGreaterThan(0);
    expect(playbook.sections.risk.some((i) => i.kind === "invalidation")).toBe(true);
    expect(playbook.sections.watching.some((i) => i.kind === "checkpoint")).toBe(true);
  });

  it("when supportDelta < 0, flipTriggers includes a supportDelta bullet", () => {
    const playbook = buildWeeklyPlaybook({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        alignment: { base: { btc: { inBand: true }, spy: { inBand: true } } },
      },
      scenarioConfig: { checkpoints: [], invalidations: [] },
      supportDelta: -0.5,
      integrity: baseIntegrity,
      btcDrift: 0,
      eqDrift: 0,
    });

    expect(playbook.flipTriggers.some((t) => t.includes("supportDelta") || t.includes("evidence tilt"))).toBe(true);
  });

  it("when drift >= 2, flipTriggers includes the drift bullet", () => {
    const playbook = buildWeeklyPlaybook({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        alignment: {
          base: { btc: { inBand: false, driftPct: -2.5 }, spy: { inBand: true } },
        },
      },
      scenarioConfig: { checkpoints: [], invalidations: [] },
      supportDelta: 0,
      integrity: baseIntegrity,
      btcDrift: -2.5,
      eqDrift: 0,
    });

    expect(playbook.flipTriggers.some((t) => t.includes("≥2%") || t.includes("2%"))).toBe(true);
  });

  it("always returns exactly 3 checkNextWeek bullets", () => {
    const playbook = buildWeeklyPlaybook({
      latestSnapshot: {
        week_ending: "2026-02-08",
        active_scenario: "base",
        alignment: { base: { btc: { inBand: true }, spy: { inBand: true } } },
      },
      scenarioConfig: { checkpoints: [], invalidations: [] },
      supportDelta: 0,
      integrity: baseIntegrity,
      btcDrift: 0,
      eqDrift: 0,
    });

    expect(playbook.checkNextWeek).toHaveLength(3);
    expect(playbook.checkNextWeek[0]).toContain("Drift");
    expect(playbook.checkNextWeek[1]).toContain("Evidence tilt");
    expect(playbook.checkNextWeek[2]).toContain("Tripwires");
  });
});
