import { describe, it, expect } from "vitest";
import { getSpxEquiv } from "../spxEquiv";

describe("getSpxEquiv", () => {
  it("computes SPX equivalent from SPY and factor", () => {
    expect(getSpxEquiv(600, 0.1)).toBe(6000);
    expect(getSpxEquiv(570, 0.1)).toBe(5700);
  });

  it("uses default factor 0.1 when not provided", () => {
    expect(getSpxEquiv(100)).toBe(1000);
  });

  it("returns 0 when factor is 0 to avoid division by zero", () => {
    expect(getSpxEquiv(100, 0)).toBe(0);
  });
});
