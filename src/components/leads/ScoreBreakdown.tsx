import { CRITERIA, criterionPoints } from "@/lib/scoring";
import { useApp, useScore } from "@/lib/store";
import type { Lead } from "@/types";
import { TierBadge } from "@/components/shared/bits";

export function ScoreBreakdown({ lead, compact }: { lead: Lead; compact?: boolean }) {
  const weights = useApp((s) => s.weights);
  const { score, tier } = useScore(lead);
  const missing = !lead.research;
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="tabular text-3xl font-semibold tracking-tight">{score}</span>
        <div>
          <TierBadge tier={tier} />
          <p className="mt-1 text-xs text-muted-foreground">out of 100 · {missing ? "low confidence — research incomplete" : "evidence-based"}</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {CRITERIA.map((c) => {
          const pts = criterionPoints(lead.scores, weights, c.key);
          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium">{c.label}</span>
                <span className="tabular text-muted-foreground">{pts} / {weights[c.key]}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${lead.scores[c.key] * 100}%` }} />
              </div>
              {!compact && <p className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</p>}
            </div>
          );
        })}
      </div>
      {lead.aiSignal === "Unknown" && (
        <p className="mt-3 rounded-md bg-muted px-2.5 py-2 text-[11px] text-muted-foreground">
          No visible AI-building signal. This lowers confidence on a 5-point criterion only — not a disqualifier.
        </p>
      )}
    </div>
  );
}
