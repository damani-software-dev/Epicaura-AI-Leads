import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp, Copy, Download, FlaskConical, History, LayoutGrid, List, Loader2, MoreHorizontal, Pencil,
  RotateCcw, Search, Star, Telescope, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChipSelect, CompanyAvatar, DemoLabel, EmptyState, PageHeader, Panel, Pill, ResearchBadge, ScoreBadge } from "@/components/shared/bits";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { getState, log, qualifyLead, queueResearch, setState, uid, now, useApp } from "@/lib/store";
import { overallScore, tierFor } from "@/lib/scoring";
import { exportLeads } from "@/lib/export";
import { fmtDate } from "@/lib/format";
import type { AiSignal, BuyerRole, Category, CompanyStage, DesignArea, DiscoveryFilters, Lead, Market, TeamSize } from "@/types";
import { discoverLeads, seedLeadsToDb } from "@/lib/discovery";

export const Route = createFileRoute("/discover")({
  validateSearch: (s: Record<string, unknown>): { new?: boolean } => (s.new === true || s.new === "true" ? { new: true } : {}),
  head: () => ({
    meta: [
      { title: "Discover Leads — EpicAura Lead Agent" },
      { name: "description", content: "Configure ICP filters and run simulated prospect discovery." },
      { property: "og:title", content: "Discover Leads — EpicAura Lead Agent" },
      { property: "og:description", content: "Configure ICP filters and run simulated prospect discovery." },
    ],
  }),
  component: Discover,
});

const MARKETS: (Market | "All Markets")[] = ["United States", "Jamaica", "Wider Caribbean", "All Markets"];
const STAGES: CompanyStage[] = ["Post-launch", "Early Traction", "Actively Acquiring Customers"];
const SIZES: TeamSize[] = ["1–5", "6–10", "11–20", "21–50", "50+"];
const CATS: Category[] = ["Fintech", "HRTech", "HealthTech", "EdTech", "MarTech", "Operations", "Logistics", "Vertical SaaS", "Other"];
const AIS: AiSignal[] = ["Lovable", "Bolt", "Replit", "Cursor", "Claude", "Other AI tools", "Unknown"];
const ROLES: BuyerRole[] = ["Founder/CEO", "CTO", "Head of Product"];
const AREAS: DesignArea[] = ["Onboarding", "Workflow UX", "Usability", "Feature Design", "UX Consistency", "Product Strategy"];

const blank = (): DiscoveryFilters => {
  const s = getState().settings;
  return { name: "", markets: s.defaultMarkets, stages: [], sizes: [], categories: [], aiSignals: [], roles: [], areas: [], minScore: s.defaultMinScore, max: s.defaultMax };
};

function matches(l: Lead, f: DiscoveryFilters, score: number) {
  const any = <T,>(arr: T[], v: T) => arr.length === 0 || arr.includes(v);
  return any(f.markets, l.market) && any(f.stages, l.stage) && any(f.sizes, l.teamSize) && any(f.categories, l.category)
    && any(f.aiSignals, l.aiSignal) && any(f.roles, l.buyer.role) && any(f.areas, l.designArea) && score >= f.minScore;
}

type SortKey = "score" | "company" | "market";

function Discover() {
  const { new: isNew } = Route.useSearch();
  const navigate = useNavigate();
  const leads = useApp((s) => s.leads);
  const sessions = useApp((s) => s.sessions);
  const weights = useApp((s) => s.weights);
  const thresholds = useApp((s) => s.thresholds);

  const [f, setF] = useState<DiscoveryFilters>(blank);
  const [allMarkets, setAllMarkets] = useState(false);
  const [running, setRunning] = useState(false);
  const [resultIds, setResultIds] = useState<string[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "score", dir: -1 });
  const [view, setView] = useState<"list" | "grid">("list");
  const [shown, setShown] = useState(10);
  const [tab, setTab] = useState("results");
  const [preview, setPreview] = useState<string | null>(null);
  const [rename, setRename] = useState<{ id: string; name: string } | null>(null);
  const [del, setDel] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) { setF(blank()); setAllMarkets(false); setResultIds(null); setSel([]); setTab("results"); navigate({ to: "/discover", search: {}, replace: true }); }
  }, [isNew, navigate]);

  const scoreOf = (l: Lead) => overallScore(l.scores, weights);

  const run = async () => {
    setRunning(true); setSel([]); setTab("results");
    try {
      const filters = { ...f, markets: allMarkets ? [] : f.markets };
      const name = f.name.trim() || `Discovery ${fmtDate(now())}`;
      const { leads: found } = await discoverLeads({ data: { filters, name } });
  
      // merge new leads into the store, deduping by domain
      setState((s) => {
        const have = new Set(s.leads.map((l) => l.domain));
        return { ...s, leads: [...s.leads, ...found.filter((l) => !have.has(l.domain))] };
      });
  
      // resolve to store IDs, then apply the min-score filter client-side
      const byDomain = new Map(getState().leads.map((l) => [l.domain, l.id]));
      const ids = found
        .map((l) => byDomain.get(l.domain)!)
        .filter((id) => scoreOf(getState().leads.find((l) => l.id === id)!) >= f.minScore)
        .sort((a, b) => scoreOf(getState().leads.find((l) => l.id === b)!) - scoreOf(getState().leads.find((l) => l.id === a)!));
  
      setResultIds(ids); setShown(10);
      setState((s) => ({ ...s, sessions: [{ id: uid("S"), name, at: now(), filters: { ...filters, name }, resultIds: ids, researched: 0, qualified: 0 }, ...s.sessions] }));
      log({ type: "Discovery", title: "Discovery session run", subject: name, outcome: "Success", details: `${ids.length} prospects discovered.` });
      toast.success(`${ids.length} prospects found`);
    } catch (e) {
      toast.error("Discovery failed", { description: e instanceof Error ? e.message : "Try again" });
    } finally {
      setRunning(false);
    }
  };

  const results = useMemo(() => {
    if (!resultIds) return [];
    const t = q.toLowerCase();
    return leads.filter((l) => resultIds.includes(l.id) && (!t || l.company.toLowerCase().includes(t) || l.domain.includes(t)))
      .sort((a, b) => {
        const v = sort.k === "score" ? scoreOf(a) - scoreOf(b) : sort.k === "company" ? a.company.localeCompare(b.company) : a.market.localeCompare(b.market);
        return v * sort.dir;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultIds, leads, q, sort, weights]);

  const selLeads = results.filter((l) => sel.includes(l.id));
  const toggleSort = (k: SortKey) => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : -1 }));

  const addToQueue = (ids: string[]) => {
    const eligible = ids.filter((id) => leads.find((l) => l.id === id)?.researchStatus === "Not started");
    if (!eligible.length) return toast.info("Selected prospects are already in research");
    queueResearch(eligible); setSel([]);
    toast.success(`${eligible.length} added to research queue`, { action: { label: "Open", onClick: () => navigate({ to: "/research" }) } });
  };
  const addQualified = (ids: string[]) => {
    let ok = 0; const fails: string[] = [];
    ids.forEach((id) => { const r = qualifyLead(id); if (r.ok) ok++; else if (r.reason) fails.push(r.reason); });
    setSel([]);
    if (ok) toast.success(`${ok} lead${ok > 1 ? "s" : ""} qualified`);
    if (fails.length) toast.warning(`${fails.length} below threshold`, { description: fails[0] });
  };

  const chips = [
    ...(allMarkets ? ["All Markets"] : f.markets), ...f.stages, ...f.sizes, ...f.categories, ...f.aiSignals, ...f.roles, ...f.areas,
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Discover Leads" description="Configure an ICP search and review suggested prospects before adding them to research." actions=
      
      {
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            try { const r = await seedLeadsToDb(); toast.success(r.message, { description: `${r.inserted} rows` }); }
            catch (e) { toast.error("Seed failed", { description: e instanceof Error ? e.message : "" }); }
          }}>Seed DB (temp)</Button>
          <DemoLabel>Simulated discovery · demo dataset</DemoLabel>
        </div>
      }
      />
      <div className="grid gap-4 xl:grid-cols-[340px_1fr]">
        <Panel title="Discovery configuration" bodyClass="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="dn">Discovery name</Label><Input id="dn" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Jamaica fintech — October" /></div>
          <div className="space-y-1.5">
            <Label>Target market</Label>
            <ChipSelect options={MARKETS} value={allMarkets ? ["All Markets"] : f.markets} onChange={(v) => {
              if (v.includes("All Markets") && !allMarkets) { setAllMarkets(true); setF({ ...f, markets: [] }); }
              else { setAllMarkets(false); setF({ ...f, markets: v.filter((x) => x !== "All Markets") as Market[] }); }
            }} />
          </div>
          <div className="space-y-1.5"><Label>Company type</Label><div><Pill tone="info">B2B SaaS</Pill></div></div>
          <div className="space-y-1.5"><Label>Company stage</Label><ChipSelect options={STAGES} value={f.stages} onChange={(v) => setF({ ...f, stages: v })} /></div>
          <div className="space-y-1.5"><Label>Team size</Label><ChipSelect options={SIZES} value={f.sizes} onChange={(v) => setF({ ...f, sizes: v })} /></div>
          <div className="space-y-1.5"><Label>Product category</Label><ChipSelect options={CATS} value={f.categories} onChange={(v) => setF({ ...f, categories: v })} /><p className="text-[11px] text-muted-foreground">None selected = All</p></div>
          <div className="space-y-1.5"><Label>AI-building signals</Label><ChipSelect options={AIS} value={f.aiSignals} onChange={(v) => setF({ ...f, aiSignals: v })} /><p className="text-[11px] text-muted-foreground">None selected = Any. A minor signal only.</p></div>
          <div className="space-y-1.5"><Label>Buyer role</Label><ChipSelect options={ROLES} value={f.roles} onChange={(v) => setF({ ...f, roles: v })} /></div>
          <div className="space-y-1.5"><Label>Design opportunity</Label><ChipSelect options={AREAS} value={f.areas} onChange={(v) => setF({ ...f, areas: v })} /></div>
          <div className="space-y-2"><div className="flex justify-between"><Label>Minimum qualification score</Label><span className="tabular text-sm font-medium">{f.minScore}</span></div><Slider value={[f.minScore]} min={0} max={100} step={5} onValueChange={([v]) => setF({ ...f, minScore: v })} /></div>
          <div className="space-y-2"><div className="flex justify-between"><Label>Max prospects to review</Label><span className="tabular text-sm font-medium">{f.max}</span></div><Slider value={[f.max]} min={5} max={50} step={5} onValueChange={([v]) => setF({ ...f, max: v })} /></div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" onClick={run} disabled={running}>{running ? <Loader2 className="animate-spin" /> : <Telescope />}{running ? "Finding prospects…" : "Find Prospects"}</Button>
            <Button variant="outline" size="icon" aria-label="Reset filters" onClick={() => { setF(blank()); setAllMarkets(false); }}><RotateCcw /></Button>
          </div>
        </Panel>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="results"><Search className="size-3.5" />Results{resultIds ? ` (${resultIds.length})` : ""}</TabsTrigger>
            <TabsTrigger value="history"><History className="size-3.5" />History ({sessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-3">
            <section className="rounded-lg border bg-card shadow-card">
              {running ? (
                <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />)}</div>
              ) : !resultIds ? (
                <EmptyState icon={<Telescope className="size-5" />} title="Configure filters and run discovery" body="Results come from the prototype's mock dataset — no live web search is performed." action={<Button size="sm" onClick={run}>Find Prospects</Button>} />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2 border-b p-3">
                    <div className="relative w-full sm:w-56"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter results…" className="h-8 pl-8" /></div>
                    <div className="flex flex-1 flex-wrap gap-1">{chips.slice(0, 6).map((c) => <Pill key={c}>{c}</Pill>)}{chips.length > 6 && <Pill>+{chips.length - 6}</Pill>}{f.minScore > 0 && <Pill>Score ≥ {f.minScore}</Pill>}</div>
                    <div className="flex rounded-md border p-0.5">
                      <button aria-label="List view" onClick={() => setView("list")} className={`rounded p-1 ${view === "list" ? "bg-accent" : "text-muted-foreground"}`}><List className="size-4" /></button>
                      <button aria-label="Grid view" onClick={() => setView("grid")} className={`rounded p-1 ${view === "grid" ? "bg-accent" : "text-muted-foreground"}`}><LayoutGrid className="size-4" /></button>
                    </div>
                  </div>
                  {sel.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 border-b bg-primary-soft/60 px-3 py-2 text-sm">
                      <span className="font-medium">{sel.length} selected</span>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => addToQueue(sel)}><FlaskConical />Add to Research Queue</Button>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => addQualified(sel)}><Star />Add to Qualified</Button>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => exportLeads(selLeads, "discovery")}><Download />Export</Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => { setResultIds((r) => r!.filter((x) => !sel.includes(x))); setSel([]); toast("Removed from results"); }}><X />Remove</Button>
                    </div>
                  )}
                  {results.length === 0 ? (
                    <EmptyState icon={<Search className="size-5" />} title="No prospects match" body="Loosen filters or lower the minimum score." />
                  ) : view === "list" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1000px] text-sm">
                        <thead><tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="w-10 px-3 py-2"><Checkbox aria-label="Select all" checked={sel.length === results.length} onCheckedChange={(c) => setSel(c ? results.map((l) => l.id) : [])} /></th>
                          <th className="px-2 py-2 font-medium"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("company")}>Company<ArrowDownUp className="size-3" /></button></th>
                          <th className="px-2 py-2 font-medium"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("market")}>Market<ArrowDownUp className="size-3" /></button></th>
                          <th className="px-2 py-2 font-medium">Category</th><th className="px-2 py-2 font-medium">Stage</th><th className="px-2 py-2 font-medium">Team</th><th className="px-2 py-2 font-medium">AI signal</th><th className="px-2 py-2 font-medium">Potential design gap</th>
                          <th className="px-2 py-2 font-medium"><button className="inline-flex items-center gap-1" onClick={() => toggleSort("score")}>Prelim. score<ArrowDownUp className="size-3" /></button></th>
                          <th className="px-2 py-2 font-medium">Research</th><th className="w-10" />
                        </tr></thead>
                        <tbody>
                          {results.slice(0, shown).map((l) => {
                            const s = scoreOf(l);
                            return (
                              <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                                <td className="px-3 py-2"><Checkbox aria-label={`Select ${l.company}`} checked={sel.includes(l.id)} onCheckedChange={(c) => setSel(c ? [...sel, l.id] : sel.filter((x) => x !== l.id))} /></td>
                                <td className="px-2 py-2"><button onClick={() => setPreview(l.id)} className="flex items-center gap-2 text-left"><CompanyAvatar name={l.company} size="sm" /><span><span className="block font-medium hover:text-primary">{l.company}</span><span className="text-xs text-muted-foreground">{l.domain}</span></span></button></td>
                                <td className="px-2 py-2 text-muted-foreground">{l.market}</td>
                                <td className="px-2 py-2">{l.category}</td>
                                <td className="px-2 py-2 text-xs">{l.stage}</td>
                                <td className="tabular px-2 py-2">{l.teamSize}</td>
                                <td className="px-2 py-2"><Pill tone={l.aiSignal === "Unknown" ? "neutral" : "info"}>{l.aiSignal}</Pill></td>
                                <td className="max-w-[220px] px-2 py-2 text-xs text-muted-foreground">{l.designGap}</td>
                                <td className="px-2 py-2"><ScoreBadge score={s} tier={tierFor(s, thresholds)} /></td>
                                <td className="px-2 py-2"><ResearchBadge status={l.researchStatus} /></td>
                                <td className="px-2 py-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-7" aria-label="Row actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => setPreview(l.id)}>Quick preview</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => navigate({ to: "/leads/$id", params: { id: l.id } })}>Open profile</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => addToQueue([l.id])}>Add to research queue</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => addQualified([l.id])}>Add to qualified</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setResultIds((r) => r!.filter((x) => x !== l.id))}>Remove from results</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                      {results.slice(0, shown).map((l) => {
                        const s = scoreOf(l); const on = sel.includes(l.id);
                        return (
                          <div key={l.id} className={`rounded-lg border p-3 ${on ? "border-primary/50 bg-primary-soft/40" : ""}`}>
                            <div className="flex items-start gap-2">
                              <Checkbox aria-label={`Select ${l.company}`} checked={on} onCheckedChange={(c) => setSel(c ? [...sel, l.id] : sel.filter((x) => x !== l.id))} className="mt-1" />
                              <button onClick={() => setPreview(l.id)} className="min-w-0 flex-1 text-left">
                                <p className="font-medium">{l.company}</p>
                                <p className="text-xs text-muted-foreground">{l.market} · {l.category} · {l.teamSize}</p>
                              </button>
                              <ScoreBadge score={s} tier={tierFor(s, thresholds)} />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">{l.designGap}</p>
                            <div className="mt-2 flex gap-1"><Pill tone={l.aiSignal === "Unknown" ? "neutral" : "info"}>{l.aiSignal}</Pill><ResearchBadge status={l.researchStatus} /></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {shown < results.length && <div className="border-t p-2 text-center"><Button variant="ghost" size="sm" onClick={() => setShown(shown + 10)}>Load more ({results.length - shown} remaining)</Button></div>}
                </>
              )}
            </section>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <section className="divide-y rounded-lg border bg-card shadow-card">
              {sessions.length === 0 && <EmptyState icon={<History className="size-5" />} title="No discovery sessions yet" />}
              {sessions.map((s) => {
                const fl = [...s.filters.markets, ...s.filters.categories, ...s.filters.stages, ...s.filters.aiSignals];
                const researched = s.resultIds.filter((id) => leads.find((l) => l.id === id)?.researchStatus === "Completed").length;
                const qualified = s.resultIds.filter((id) => leads.find((l) => l.id === id)?.qualified).length;
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(s.at)} · {fl.length ? fl.join(", ") : "All markets"}{s.filters.minScore ? ` · score ≥ ${s.filters.minScore}` : ""}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground"><span><b className="tabular text-foreground">{s.resultIds.length}</b> found</span><span><b className="tabular text-foreground">{researched}</b> researched</span><span><b className="tabular text-foreground">{qualified}</b> qualified</span></div>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => { setF(s.filters); setAllMarkets(s.filters.markets.length === 0); setResultIds(s.resultIds); setSel([]); setTab("results"); }}>Reopen</Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-7" aria-label="Session actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setState((st) => ({ ...st, sessions: [{ ...s, id: uid("S"), name: `${s.name} (copy)`, at: now() }, ...st.sessions] })); toast.success("Session duplicated"); }}><Copy />Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRename({ id: s.id, name: s.name })}><Pencil />Rename</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDel(s.id)}><Trash2 />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </section>
          </TabsContent>
        </Tabs>
      </div>

      <LeadDrawer id={preview} onClose={() => setPreview(null)} />

      <Dialog open={!!rename} onOpenChange={(o) => !o && setRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename session</DialogTitle></DialogHeader>
          <Input value={rename?.name ?? ""} onChange={(e) => setRename((r) => r && { ...r, name: e.target.value })} />
          <DialogFooter><Button onClick={() => { if (!rename?.name.trim()) return; setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === rename.id ? { ...x, name: rename.name.trim() } : x)) })); setRename(null); toast.success("Session renamed"); }}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this discovery session?</AlertDialogTitle><AlertDialogDescription>Prospects stay in your workspace; only the session record is removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== del) })); setDel(null); toast.success("Session deleted"); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
