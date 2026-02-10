import { describe, it, expect } from "vitest";
import { softmax } from "../softmax";

describe("softmax", () => {
  it("converts scores to probabilities that sum to 1", () => {
    const probs = softmax({ bull: 1, base: 0, bear: -1 });
    const sum = probs.bull! + probs.base! + probs.bear!;
    expect(sum).toBeCloseTo(1);
  });

  it("higher score gets higher probability", () => {
    const probs = softmax({ bull: 2, base: 0, bear: -2 });
    expect(probs.bull).toBeGreaterThan(probs.base!);
    expect(probs.bull).toBeGreaterThan(probs.bear!);
    expect(probs.bear).toBeLessThan(probs.base!);
  });

  it("handles empty object", () => {
    expect(softmax({})).toEqual({});
  });
});
