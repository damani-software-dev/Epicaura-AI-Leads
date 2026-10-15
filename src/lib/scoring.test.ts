import { describe, expect, it } from "vitest";
import { DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, overallScore, tierFor, weightTotal } from "./scoring";

const full = { icp: 1, design: 1, commercial: 1, buyer: 1, timing: 1, ai: 1 };

describe("scoring", () => {
  it("default weights total 100", () => {
    expect(weightTotal(DEFAULT_WEIGHTS)).toBe(100);
    expect(DEFAULT_WEIGHTS).toEqual({ icp: 25, design: 25, commercial: 20, buyer: 15, timing: 10, ai: 5 });
  });
  it("AI signal alone yields only 5 points", () => {
    expect(overallScore({ icp: 0, design: 0, commercial: 0, buyer: 0, timing: 0, ai: 1 }, DEFAULT_WEIGHTS)).toBe(5);
    expect(overallScore(full, DEFAULT_WEIGHTS)).toBe(100);
  });
  it("tiers follow thresholds", () => {
    expect(tierFor(80, DEFAULT_THRESHOLDS)).toBe("High Priority");
    expect(tierFor(79, DEFAULT_THRESHOLDS)).toBe("Qualified");
    expect(tierFor(65, DEFAULT_THRESHOLDS)).toBe("Qualified");
    expect(tierFor(64, DEFAULT_THRESHOLDS)).toBe("Needs Review");
    expect(tierFor(45, DEFAULT_THRESHOLDS)).toBe("Needs Review");
    expect(tierFor(44, DEFAULT_THRESHOLDS)).toBe("Low Priority");
  });
});
