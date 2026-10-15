import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Columns3, List, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChipSelect, PageHeader, Pill, ScoreBadge, StatusBadge } from "@/components/shared/bits";
import { now, setStatus, uid, updateLead, useApp } from "@/lib/store";
import { overallScore, tierFor } from "@/lib/scoring";
import { fmtDate, fmtMoney, relTime } from "@/lib/format";
import { PIPELINE_STAGES, type Category, type LeadStatus, type Market } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — EpicAura Lead Agent" },
      { name: "description", content: "Track qualified prospects from outreach to retainer." },
      { property: "og:title", content: "Pipeline — EpicAura Lead Agent" },
      { property: "og:description", content: "Track qualified prospects from outreach to retainer." },
    ],
  }),
  component: Pipeline,
});

const MARKETS: Market[] = ["United States", "Jamaica", "Wider Caribbean"];
const CATS: Category[] = ["Fintech", "HRTech", "HealthTech", "EdTech", "MarTech", "Operations", "Logistics", "Vertical SaaS", "Other"];

function Pipeline() {
  const leads = useApp((s) => s.leads);
  const weights = useApp((s) => s.weights);
  const thresholds = useApp((s) => s.thresholds);
  const [view, setView] = useState<"board" | "list">("board");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [stages, setStages] = useState<LeadStatus[]>([]);
  const [minScore, setMinScore] = useState(0);
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStatus | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const items = useMemo(() => leads.filter((l) => PIPELINE_STAGES.includes(l.status)).map((l) => ({ l, score: overallScore(l.scores, weights) }))
    .filter(({ l, score }) => (!markets.length || markets.includes(l.market)) && (!cats.length || cats.includes(l.category)) && score >= minScore && (!stages.length || stages.includes(l.status))), [leads, weights, markets, cats, minScore, stages]);
  const visibleStages = stages.length ? PIPELINE_STAGES.filter((s) => stages.includes(s)) : PIPELINE_STAGES;
  const move = (id: string, s: LeadStatus) => { const l = leads.find((x) => x.id === id); if (l && l.status !== s) { setStatus(id, s); toast.success(`${l.company} → ${s}`); } };
  const est = items.filter(({ l }) => !["Lost", "Won"].includes(l.status)).reduce((a, { l }) => a + (l.estRetainer ?? 0), 0);

  const Menu = ({ id }: { id: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-6" aria-label="Move card"><MoreHorizontal className="size-3.5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {PIPELINE_STAGES.map((s) => <DropdownMenuItem key={s} onClick={() => move(id, s)}>{s}</DropdownMenuItem>)}
        <DropdownMenuItem onClick={() => setOpen(id)}>Edit details…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="Pipeline"
        description={`Open estimated retainer value: ${fmtMoney(est)}/mo — estimates only, not confirmed revenue.`}
        actions={
          <div className="flex rounded-md border bg-card p-0.5">
            <button onClick={() => setView("board")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view === "board" ? "bg-accent font-medium" : "text-muted-foreground")}><Columns3 className="size-3.5" />Board</button>
            <button onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view === "list" ? "bg-accent font-medium" : "text-muted-foreground")}><List className="size-3.5" />List</button>
          </div>
        }
      />
      <div className="mb-4 grid gap-3 rounded-lg border bg-card p-3 shadow-card md:grid-cols-[1fr_1fr_200px]">
        <div><p className="mb-1 text-xs font-medium text-muted-foreground">Market</p><ChipSelect options={MARKETS} value={markets} onChange={setMarkets} /></div>
        <div><p className="mb-1 text-xs font-medium text-muted-foreground">Stage</p><ChipSelect options={PIPELINE_STAGES} value={stages} onChange={setStages} /></div>
        <div><p className="mb-1 flex justify-between text-xs font-medium text-muted-foreground"><span>Min score</span><span className="tabular">{minScore}</span></p><Slider value={[minScore]} max={100} step={5} onValueChange={([v]) => setMinScore(v)} /></div>
        <div className="md:col-span-3"><p className="mb-1 text-xs font-medium text-muted-foreground">Category</p><ChipSelect options={CATS} value={cats} onChange={setCats} /></div>
      </div>

      {view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {visibleStages.map((s) => {
            const col = items.filter(({ l }) => l.status === s);
            return (
              <div
                key={s}
                onDragOver={(e) => { e.preventDefault(); setOver(s); }}
                onDragLeave={() => setOver(null)}
                onDrop={() => { if (drag) move(drag, s); setDrag(null); setOver(null); }}
                className={cn("flex w-64 shrink-0 flex-col rounded-lg border bg-muted/40 transition-colors", over === s && "border-primary/50 bg-primary-soft/50")}
              >
                <div className="flex items-center justify-between px-3 py-2"><span className="text-xs font-semibold">{s}</span><span className="tabular text-xs text-muted-foreground">{col.length}</span></div>
                <div className="flex min-h-24 flex-col gap-2 px-2 pb-2">
                  {col.map(({ l, score }) => (
                    <div key={l.id} draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)} className={cn("cursor-grab rounded-md border bg-card p-2.5 shadow-card active:cursor-grabbing", drag === l.id && "opacity-50")}>
                      <div className="flex items-start justify-between gap-1">
                        <button onClick={() => setOpen(l.id)} className="text-left text-sm font-medium hover:text-primary">{l.company}</button>
                        <Menu id={l.id} />
                      </div>
                      <p className="text-xs text-muted-foreground">{l.buyer.name} · {l.market}</p>
                      <div className="mt-2 flex items-center justify-between"><ScoreBadge score={score} tier={tierFor(score, thresholds)} /><Pill>{l.designArea}</Pill></div>
                      <p className="mt-2 text-xs"><span className="text-muted-foreground">Next:</span> {l.nextAction}</p>
                      <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><span>{relTime(l.lastActivity)}</span>{l.estRetainer && <span>{fmtMoney(l.estRetainer)}/mo est.</span>}</div>
                    </div>
                  ))}
                  {col.length === 0 && <p className="py-6 text-center text-[11px] text-muted-foreground">Drop a card here</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-3 py-2 font-medium">Company</th><th className="px-2 py-2 font-medium">Stage</th><th className="px-2 py-2 font-medium">Score</th><th className="px-2 py-2 font-medium">Next action</th><th className="px-2 py-2 font-medium">Follow-up</th><th className="px-2 py-2 font-medium">Est. retainer</th><th className="w-10" /></tr></thead>
            <tbody>
              {items.map(({ l, score }) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-3 py-2"><button onClick={() => setOpen(l.id)} className="font-medium hover:text-primary">{l.company}</button><p className="text-xs text-muted-foreground">{l.buyer.name}</p></td>
                  <td className="px-2 py-2"><StatusBadge status={l.status} /></td>
                  <td className="px-2 py-2"><ScoreBadge score={score} tier={tierFor(score, thresholds)} /></td>
                  <td className="px-2 py-2 text-xs">{l.nextAction}</td>
                  <td className="px-2 py-2 text-xs">{fmtDate(l.followUp)}</td>
                  <td className="tabular px-2 py-2 text-xs">{l.estRetainer ? `${fmtMoney(l.estRetainer)}/mo est.` : "—"}</td>
                  <td className="px-2 py-2"><Menu id={l.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CardDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function CardDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const lead = useApp((s) => s.leads.find((l) => l.id === id));
  const [next, setNext] = useState(""); const [follow, setFollow] = useState(""); const [note, setNote] = useState(""); const [stage, setStage] = useState<LeadStatus>("Qualified");
  const [loaded, setLoaded] = useState<string | null>(null);
  if (lead && loaded !== lead.id) { setLoaded(lead.id); setNext(lead.nextAction); setFollow(lead.followUp?.slice(0, 10) ?? ""); setStage(lead.status); setNote(""); }
  return (
    <Sheet open={!!lead} onOpenChange={(o) => { if (!o) { onClose(); setLoaded(null); } }}>
      <SheetContent className="w-full sm:max-w-md">
        {lead && (
          <>
            <SheetHeader><SheetTitle>{lead.company}</SheetTitle><SheetDescription>{lead.buyer.name} · {lead.buyer.role}</SheetDescription></SheetHeader>
            <div className="space-y-4 px-4">
              <div className="space-y-1"><Label>Stage</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as LeadStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PIPELINE_STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><Label>Next action</Label><Input value={next} onChange={(e) => setNext(e.target.value)} /></div>
              <div className="space-y-1"><Label className="flex items-center gap-1"><CalendarClock className="size-3.5" />Follow-up date</Label><Input type="date" value={follow} onChange={(e) => setFollow(e.target.value)} /></div>
              <div className="space-y-1"><Label>Add note</Label><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  if (stage !== lead.status) setStatus(lead.id, stage);
                  updateLead(lead.id, (l) => ({ nextAction: next, followUp: follow ? new Date(follow).toISOString() : undefined, notes: note.trim() ? [{ id: uid("n"), text: note.trim(), at: now() }, ...l.notes] : l.notes }));
                  toast.success("Opportunity updated"); onClose(); setLoaded(null);
                }}>Save</Button>
                <Button variant="outline" asChild><Link to="/leads/$id" params={{ id: lead.id }}>Full profile</Link></Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
