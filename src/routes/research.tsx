import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Expand, FlaskConical, Pencil, Play, RefreshCw, Star, ThumbsUp, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CompanyAvatar, DemoLabel, EmptyState, PageHeader, Panel, ResearchBadge, ScoreBadge } from "@/components/shared/bits";
import { ResearchDetail } from "@/components/research/ResearchDetail";
import { ScoreBreakdown } from "@/components/leads/ScoreBreakdown";
import { completeResearch, log, now, qualifyLead, setStatus, uid, updateLead, useApp } from "@/lib/store";
import { overallScore, tierFor } from "@/lib/scoring";
import type { ResearchStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Lead Research — EpicAura Lead Agent" },
      { name: "description", content: "Research queue and evidence workspace for prospects." },
      { property: "og:title", content: "Lead Research — EpicAura Lead Agent" },
      { property: "og:description", content: "Research queue and evidence workspace for prospects." },
    ],
  }),
  component: ResearchPage,
});

const GROUPS: ResearchStatus[] = ["In progress", "Queued", "Needs review", "Completed"];
const STEPS = ["Reading company website", "Analyzing product pages", "Checking AI-building signals", "Running UX heuristics", "Researching buyer", "Writing summary"];

function ResearchPage() {
  const leads = useApp((s) => s.leads);
  const weights = useApp((s) => s.weights);
  const thresholds = useApp((s) => s.thresholds);
  const queue = useMemo(() => leads.filter((l) => l.researchStatus !== "Not started" && l.status !== "Rejected"), [leads]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [group, setGroup] = useState<ResearchStatus | "All">("All");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string | null>(null);
  const [reject, setReject] = useState(false);

  const active = leads.find((l) => l.id === (activeId ?? queue[0]?.id));

  const runResearch = (id: string, variant = 0) => {
    updateLead(id, { researchStatus: "In progress" });
    if (!variant) log({ type: "Research", title: "Research started", subject: leads.find((l) => l.id === id)!.company, leadId: id, outcome: "Info", details: "Simulated research run." });
    let p = 0;
    const t = setInterval(() => {
      p += 100 / STEPS.length;
      setProgress((x) => ({ ...x, [id]: Math.min(100, p) }));
      if (p >= 100) {
        clearInterval(t);
        completeResearch(id, variant);
        setProgress((x) => { const n = { ...x }; delete n[id]; return n; });
        toast.success("Research complete (simulated)");
      }
    }, 450);
  };

  useEffect(() => () => undefined, []);

  const filtered = group === "All" ? queue : queue.filter((l) => l.researchStatus === group);
  const pr = active ? progress[active.id] : undefined;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Lead Research" description="Investigate each prospect, separate observations from hypotheses, and approve findings." actions={<DemoLabel>Mock research content</DemoLabel>} />
      {queue.length === 0 ? (
        <Panel><EmptyState icon={<FlaskConical className="size-5" />} title="Research queue is empty" body="Add prospects from Discover Leads." action={<Button asChild size="sm"><Link to="/discover">Discover Leads</Link></Button>} /></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <section className="rounded-lg border bg-card shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="flex flex-wrap gap-1 border-b p-2">
              {(["All", ...GROUPS] as const).map((g) => (
                <button key={g} onClick={() => setGroup(g)} className={cn("rounded px-2 py-1 text-xs", group === g ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/60")}>
                  {g} <span className="tabular text-muted-foreground">{g === "All" ? queue.length : queue.filter((l) => l.researchStatus === g).length}</span>
                </button>
              ))}
            </div>
            <ul>
              {filtered.map((l) => {
                const s = overallScore(l.scores, weights);
                return (
                  <li key={l.id}>
                    <button onClick={() => setActiveId(l.id)} className={cn("flex w-full items-center gap-2.5 border-b px-3 py-2.5 text-left last:border-0 hover:bg-muted/50", active?.id === l.id && "bg-primary-soft/60")}>
                      <CompanyAvatar name={l.company} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{l.company}</p>
                        <div className="mt-0.5 flex items-center gap-1.5"><span className="text-[11px] text-muted-foreground">{l.market}</span><ResearchBadge status={l.researchStatus} /></div>
                      </div>
                      <span className="tabular text-sm font-semibold">{s}</span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Nothing here.</li>}
            </ul>
          </section>

          {active && (
            <div className="space-y-4">
              <section className="rounded-lg border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-start gap-3">
                  <CompanyAvatar name={active.company} size="lg" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{active.company}</h2>
                    <p className="text-sm text-muted-foreground">{active.category} · {active.country}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2"><ResearchBadge status={active.researchStatus} />{active.research?.approved && <span className="text-xs text-success">Findings approved</span>}</div>
                  </div>
                  <ScoreBadge score={overallScore(active.scores, weights)} tier={tierFor(overallScore(active.scores, weights), thresholds)} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(active.researchStatus === "Queued" || active.researchStatus === "Not started") && <Button size="sm" onClick={() => runResearch(active.id)} disabled={pr != null}><Play />Start Research</Button>}
                  {active.researchStatus === "Needs review" && <Button size="sm" onClick={() => { updateLead(active.id, { researchStatus: "Completed" }); toast.success("Marked complete"); }}><CheckCircle2 />Mark Research Complete</Button>}
                  {active.research && <Button size="sm" variant="outline" onClick={() => runResearch(active.id, Date.now() % 7 + 1)} disabled={pr != null}><RefreshCw />Re-run Research</Button>}
                  <Button size="sm" variant="outline" onClick={() => setNotes(active.notes[0]?.text ?? "")}><Pencil />Edit Notes</Button>
                  {active.research && !active.research.approved && <Button size="sm" variant="outline" onClick={() => { updateLead(active.id, (l) => ({ research: { ...l.research!, approved: true }, researchStatus: "Completed" })); log({ type: "Research", title: "Findings approved", subject: active.company, leadId: active.id, outcome: "Success", details: "Research findings approved for qualification." }); toast.success("Findings approved"); }}><ThumbsUp />Approve Findings</Button>}
                  {!active.qualified && <Button size="sm" variant="outline" onClick={() => { const r = qualifyLead(active.id); r.ok ? toast.success(`${active.company} added to Qualified Leads`) : toast.warning("Below threshold", { description: r.reason }); }}><Star />Add to Qualified</Button>}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setReject(true)}><XCircle />Reject</Button>
                  <Button size="sm" variant="ghost" asChild><Link to="/leads/$id" params={{ id: active.id }}><Expand />Full page</Link></Button>
                </div>
                {pr != null && (
                  <div className="mt-4 rounded-md border bg-muted/40 p-3">
                    <div className="mb-2 flex justify-between text-xs"><span>{STEPS[Math.min(STEPS.length - 1, Math.floor((pr / 100) * STEPS.length))]}…</span><span className="tabular">{Math.round(pr)}%</span></div>
                    <Progress value={pr} />
                  </div>
                )}
              </section>
              <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                <Panel>
                  {pr != null ? (
                    <div className="space-y-3">{[80, 60, 90, 70, 50].map((w) => <div key={w} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />)}</div>
                  ) : <ResearchDetail lead={active} />}
                </Panel>
                <Panel title="Qualification score"><ScoreBreakdown lead={active} compact /></Panel>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={notes != null} onOpenChange={(o) => !o && setNotes(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Research notes</DialogTitle></DialogHeader>
          <Textarea rows={6} value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="What did you verify or still need to check?" />
          <DialogFooter><Button onClick={() => { if (active && notes?.trim()) updateLead(active.id, (l) => ({ notes: [{ id: uid("n"), text: notes.trim(), at: now() }, ...l.notes.slice(1)] })); setNotes(null); toast.success("Notes saved"); }}>Save notes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={reject} onOpenChange={setReject}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Reject {active?.company}?</AlertDialogTitle><AlertDialogDescription>The prospect leaves the queue and is marked Rejected. You can restore it from its profile.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (active) { setStatus(active.id, "Rejected"); setActiveId(null); toast("Prospect rejected"); } }}>Reject</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
