import { describe, it, expect } from "vitest";
import { getWeekEnding, previousWeekEnding, parseWeekEnding } from "../dates";

describe("dates", () => {
  it("previousWeekEnding returns Friday 7 days before", () => {
    expect(previousWeekEnding("2026-03-13")).toBe("2026-03-06");
    expect(previousWeekEnding("2026-02-13")).toBe("2026-02-06");
  });

  it("parseWeekEnding returns a Date", () => {
    const d = parseWeekEnding("2026-03-13");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(13);
  });

  it("getWeekEnding returns YYYY-MM-DD string for Friday of week", () => {
    const we = getWeekEnding(new Date("2026-03-10")); // Tuesday
    expect(we).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const d = parseWeekEnding(we);
    expect(d.getDay()).toBe(5);
  });
});
