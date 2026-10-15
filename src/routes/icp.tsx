import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipSelect, PageHeader, Panel, TierBadge } from "@/components/shared/bits";
import { CRITERIA, DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, criterionPoints, overallScore, tierFor, weightTotal } from "@/lib/scoring";
import { log, setState, useApp, type Exclusions } from "@/lib/store";
import type { AiSignal, BuyerRole, Category, CompanyStage, DesignArea, Market, TeamSize, Thresholds, Weights } from "@/types";

export const Route = createFileRoute("/icp")({
  head: () => ({
    meta: [
      { title: "ICP & Scoring — EpicAura Lead Agent" },
      { name: "description", content: "Configure the ideal customer profile, exclusions, and scoring weights." },
      { property: "og:title", content: "ICP & Scoring — EpicAura Lead Agent" },
      { property: "og:description", content: "Configure the ideal customer profile, exclusions, and scoring weights." },
    ],
  }),
  component: IcpPage,
});

const MARKETS: Market[] = ["United States", "Jamaica", "Wider Caribbean"];
const SIZES: TeamSize[] = ["1–5", "6–10", "11–20", "21–50", "50+"];
const STAGES: CompanyStage[] = ["Post-launch", "Early Traction", "Actively Acquiring Customers"];
const CATS: Category[] = ["Fintech", "HRTech", "HealthTech", "EdTech", "MarTech", "Operations", "Logistics", "Vertical SaaS", "Other"];
const ROLES: BuyerRole[] = ["Founder/CEO", "CTO", "Head of Product"];
const AIS: AiSignal[] = ["Lovable", "Bolt", "Replit", "Cursor", "Claude", "Other AI tools"];
const AREAS: DesignArea[] = ["Onboarding", "Workflow UX", "Usability", "Feature Design", "UX Consistency", "Product Strategy"];
const EXCL: [keyof Exclusions, string][] = [
  ["preLaunch", "Pre-launch products without a live offering"], ["b2cOnly", "B2C-only businesses"], ["agencies", "Agencies and generic service businesses"],
  ["noDesignOpportunity", "No credible product-design opportunity"], ["inactive", "Inactive products with no signs of continued development"], ["noCommercial", "Insufficient evidence of commercial potential"],
];

function IcpPage() {
  const icp = useApp((s) => s.icp);
  const exclusions = useApp((s) => s.exclusions);
  const saved = useApp((s) => s.weights);
  const savedT = useApp((s) => s.thresholds);
  const leads = useApp((s) => s.leads);
  const [w, setW] = useState<Weights>(saved);
  const [t, setT] = useState<Thresholds>(savedT);
  const [sampleId, setSampleId] = useState(leads[0]?.id);
  const total = weightTotal(w);
  const tValid = t.high > t.qualified && t.qualified > t.review && t.review >= 0 && t.high <= 100;
  const sample = leads.find((l) => l.id === sampleId) ?? leads[0];
  const setIcp = (p: Partial<typeof icp>) => setState((s) => ({ ...s, icp: { ...s.icp, ...p } }));
  const dirty = JSON.stringify(w) !== JSON.stringify(saved) || JSON.stringify(t) !== JSON.stringify(savedT);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="ICP & Scoring" description="Define who EpicAura is looking for and how prospects are scored. Changes apply across the workspace." />
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel title="Ideal customer profile" bodyClass="space-y-4">
            {([
              ["Primary markets", MARKETS, icp.primaryMarkets, (v: Market[]) => setIcp({ primaryMarkets: v })],
              ["Secondary markets", MARKETS, icp.secondaryMarkets, (v: Market[]) => setIcp({ secondaryMarkets: v })],
              ["Company size", SIZES, icp.sizes, (v: TeamSize[]) => setIcp({ sizes: v })],
              ["Company stages", STAGES, icp.stages, (v: CompanyStage[]) => setIcp({ stages: v })],
              ["Product categories", CATS, icp.categories, (v: Category[]) => setIcp({ categories: v })],
              ["Preferred buyer roles", ROLES, icp.roles, (v: BuyerRole[]) => setIcp({ roles: v })],
              ["AI-building tools & signals", AIS, icp.aiTools, (v: AiSignal[]) => setIcp({ aiTools: v })],
              ["Core design opportunities", AREAS, icp.areas, (v: DesignArea[]) => setIcp({ areas: v })],
            ] as const).map(([label, opts, val, on]) => (
              <div key={label}><p className="mb-1.5 text-xs font-medium">{label}</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <ChipSelect options={opts as readonly string[]} value={val as string[]} onChange={on as any} />
              </div>
            ))}
          </Panel>
          <Panel title="Exclusion criteria" bodyClass="space-y-2.5">
            {EXCL.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 text-sm">{label}<Switch checked={exclusions[k]} onCheckedChange={(v) => setState((s) => ({ ...s, exclusions: { ...s.exclusions, [k]: v } }))} /></label>
            ))}
            <div className="border-t pt-2.5"><label className="flex items-center justify-between gap-3 text-sm"><span>Allow manual override for review<span className="block text-xs text-muted-foreground">Excluded prospects can still be qualified by a person</span></span><Switch checked={exclusions.allowManualOverride} onCheckedChange={(v) => setState((s) => ({ ...s, exclusions: { ...s.exclusions, allowManualOverride: v } }))} /></label></div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Scoring weights" action={<Button size="sm" variant="ghost" className="h-7" onClick={() => { setW({ ...DEFAULT_WEIGHTS }); setT({ ...DEFAULT_THRESHOLDS }); }}><RotateCcw />Defaults</Button>}>
            <div className="space-y-2">
              {CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{c.label}</span>
                  <Input type="number" min={0} max={100} value={w[c.key]} onChange={(e) => setW({ ...w, [c.key]: Math.max(0, Number(e.target.value) || 0) })} className="h-8 w-16 text-right tabular" aria-label={`${c.label} weight`} />
                </div>
              ))}
            </div>
            <div className={`mt-3 flex items-center gap-2 rounded-md px-2.5 py-2 text-sm ${total === 100 ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive"}`}>
              {total === 100 ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
              Total: <b className="tabular">{total}</b> / 100 {total !== 100 && "— weights must total 100"}
            </div>
            <p className="mb-2 mt-4 text-xs font-medium">Qualification thresholds</p>
            <div className="grid grid-cols-3 gap-2">
              {([["high", "High Priority ≥"], ["qualified", "Qualified ≥"], ["review", "Needs Review ≥"]] as const).map(([k, l]) => (
                <label key={k} className="text-[11px] text-muted-foreground">{l}<Input type="number" value={t[k]} onChange={(e) => setT({ ...t, [k]: Number(e.target.value) || 0 })} className="mt-1 h-8 tabular" /></label>
              ))}
            </div>
            {!tValid && <p className="mt-2 text-xs text-destructive">Thresholds must descend: High &gt; Qualified &gt; Review.</p>}
            <Button className="mt-4 w-full" disabled={total !== 100 || !tValid || !dirty} onClick={() => { setState((s) => ({ ...s, weights: w, thresholds: t })); log({ type: "Configuration", title: "Scoring updated", subject: "ICP & Scoring", outcome: "Info", details: `Weights ${Object.values(w).join("/")}; thresholds ${t.high}/${t.qualified}/${t.review}.` }); toast.success("Scoring saved — all scores recalculated"); }}><Save />Save scoring</Button>
          </Panel>
          {sample && (
            <Panel title="Live score preview" action={
              <Select value={sample.id} onValueChange={setSampleId}><SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.company}</SelectItem>)}</SelectContent></Select>
            }>
              {(() => {
                const sc = overallScore(sample.scores, w);
                return (
                  <>
                    <div className="mb-3 flex items-center gap-3"><span className="tabular text-3xl font-semibold">{sc}</span><TierBadge tier={tierFor(sc, t)} /></div>
                    <ul className="space-y-1 text-sm">{CRITERIA.map((c) => <li key={c.key} className="flex justify-between"><span className="text-muted-foreground">{c.label}</span><span className="tabular">{criterionPoints(sample.scores, w, c.key)} / {w[c.key]}</span></li>)}</ul>
                    <p className="mt-2 text-[11px] text-muted-foreground">Preview uses unsaved values.</p>
                  </>
                );
              })()}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
