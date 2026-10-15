import type { CriterionKey, CriterionScores, Thresholds, Tier, Weights } from "@/types";

export const DEFAULT_WEIGHTS: Weights = { icp: 25, design: 25, commercial: 20, buyer: 15, timing: 10, ai: 5 };
export const DEFAULT_THRESHOLDS: Thresholds = { high: 80, qualified: 65, review: 45 };

export const CRITERIA: { key: CriterionKey; label: string; hint: string }[] = [
  { key: "icp", label: "ICP Fit", hint: "Founder-led B2B SaaS, live product, stage, size, market" },
  { key: "design", label: "Evidence of Product-Design Need", hint: "Observable friction, complexity, limited design capacity" },
  { key: "commercial", label: "Commercial Readiness", hint: "Active acquisition, monetization, capacity to invest" },
  { key: "buyer", label: "Buyer Accessibility", hint: "Identifiable decision-maker and professional channel" },
  { key: "timing", label: "Timing & Growth Signals", hint: "Recent launch, expansion, funding, hiring" },
  { key: "ai", label: "AI-Building Signal", hint: "Public evidence of AI-assisted development" },
];

export function weightTotal(w: Weights): number {
  return Object.values(w).reduce((a, b) => a + b, 0);
}

export function criterionPoints(scores: CriterionScores, w: Weights, key: CriterionKey): number {
  return Math.round(scores[key] * w[key]);
}

export function overallScore(scores: CriterionScores, w: Weights): number {
  const total = weightTotal(w) || 100;
  const raw = (Object.keys(w) as CriterionKey[]).reduce((a, k) => a + scores[k] * w[k], 0);
  return Math.round((raw / total) * 100);
}

export function tierFor(score: number, t: Thresholds): Tier {
  if (score >= t.high) return "High Priority";
  if (score >= t.qualified) return "Qualified";
  if (score >= t.review) return "Needs Review";
  return "Low Priority";
}

export function isQualifiable(score: number, t: Thresholds): boolean {
  return score >= t.qualified;
}
