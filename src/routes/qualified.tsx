import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowDownUp, Columns3, Download, Filter, MoreHorizontal, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChipSelect, CompanyAvatar, EmptyState, PageHeader, Pill, ScoreBadge, StatusBadge, TierBadge } from "@/components/shared/bits";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { setStatus, updateLead, useApp } from "@/lib/store";
import { overallScore, tierFor } from "@/lib/scoring";
import { exportLeads } from "@/lib/export";
import { fmtMoney, relTime } from "@/lib/format";
import { PIPELINE_STAGES, type Category, type Lead, type Market, type Tier } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/qualified")({
  head: () => ({
    meta: [
      { title: "Qualified Leads — EpicAura Lead Agent" },
      { name: "description", content: "Working list of qualified prospects worth pursuing." },
      { property: "og:title", content: "Qualified Leads — EpicAura Lead Agent" },
      { property: "og:description", content: "Working list of qualified prospects worth pursuing." },
    ],
  }),
  component: Qualified,
});

type Row = { l: Lead; score: number; tier: Tier; completeness: number };
const VIEWS: { name: string; fn: (r: Row) => boolean }[] = [
  { name: "All Qualified Leads", fn: () => true },
  { name: "High Priority", fn: (r) => r.tier === "High Priority" },
  { name: "Jamaica", fn: (r) => r.l.market === "Jamaica" },
  { name: "United States", fn: (r) => r.l.market === "United States" },
  { name: "Strong UX Opportunities", fn: (r) => r.l.scores.design >= 0.8 },
  { name: "AI-Building Signals", fn: (r) => r.l.aiSignal !== "Unknown" },
  { name: "Outreach Ready", fn: (r) => r.l.status === "Outreach Ready" },
  { name: "Needs Research Review", fn: (r) => r.completeness < 100 || r.tier === "Needs Review" },
];
const COLS = ["Buyer", "Market", "Category", "Score", "Tier", "Opportunity", "Potential", "Research", "Outreach", "Last activity", "Owner"] as const;
type Col = (typeof COLS)[number];
const MARKETS: Market[] = ["United States", "Jamaica", "Wider Caribbean"];
const CATS: Category[] = ["Fintech", "HRTech", "HealthTech", "EdTech", "MarTech", "Operations", "Logistics", "Vertical SaaS", "Other"];
const TIERS: Tier[] = ["High Priority", "Qualified", "Needs Review", "Low Priority"];
type SortK = "company" | "score" | "activity" | "potential";

function Qualified() {
  const leads = useApp((s) => s.leads);
  const weights = useApp((s) => s.weights);
  const thresholds = useApp((s) => s.thresholds);
  const pageSize = useApp((s) => s.settings.pageSize);
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS[0].name);
  const [q, setQ] = useState("");
  const [markets, setMarkets] = useState<Market[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [hidden, setHidden] = useState<Col[]>(["Owner", "Category"]);
  const [sort, setSort] = useState<{ k: SortK; dir: 1 | -1 }>({ k: "score", dir: -1 });
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => leads.filter((l) => l.qualified).map((l) => {
    const score = overallScore(l.scores, weights);
    const completeness = l.research ? (l.research.approved ? 100 : 80) : l.researchStatus === "In progress" ? 40 : 20;
    return { l, score, tier: tierFor(score, thresholds), completeness };
  }), [leads, weights, thresholds]);

  const filtered = useMemo(() => {
    const vf = VIEWS.find((v) => v.name === view)!.fn;
    const t = q.toLowerCase();
    return rows.filter((r) => vf(r) && (!t || r.l.company.toLowerCase().includes(t) || r.l.buyer.name.toLowerCase().includes(t))
      && (!markets.length || markets.includes(r.l.market)) && (!cats.length || cats.includes(r.l.category)) && (!tiers.length || tiers.includes(r.tier)))
      .sort((a, b) => {
        const v = sort.k === "company" ? a.l.company.localeCompare(b.l.company) : sort.k === "score" ? a.score - b.score : sort.k === "potential" ? (a.l.estRetainer ?? 0) - (b.l.estRetainer ?? 0) : a.l.lastActivity.localeCompare(b.l.lastActivity);
        return v * sort.dir;
      });
  }, [rows, view, q, markets, cats, tiers, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pg = Math.min(page, pages - 1);
  const pageRows = filtered.slice(pg * pageSize, pg * pageSize + pageSize);
  const show = (c: Col) => !hidden.includes(c);
  const SortBtn = ({ k, children }: { k: SortK; children: React.ReactNode }) => (
    <button className="inline-flex items-center gap-1" onClick={() => setSort((s) => ({ k, dir: s.k === k ? (s.dir === 1 ? -1 : 1) : -1 }))}>{children}<ArrowDownUp className={cn("size-3", sort.k === k && "text-primary")} /></button>
  );
  const nFilters = markets.length + cats.length + tiers.length;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Qualified Leads" description="Prospects that cleared the qualification threshold and are worth pursuing." actions={<Button size="sm" variant="outline" onClick={() => exportLeads(filtered.map((r) => r.l), "qualified")}><Download />Export</Button>} />

      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {VIEWS.map((v) => {
          const n = rows.filter(v.fn).length;
          return (
            <button key={v.name} onClick={() => { setView(v.name); setPage(0); }} className={cn("whitespace-nowrap rounded-md border px-2.5 py-1 text-xs transition-colors", view === v.name ? "border-foreground/20 bg-card font-medium shadow-card" : "border-transparent text-muted-foreground hover:bg-accent")}>
              {v.name} <span className="tabular text-muted-foreground">{n}</span>
            </button>
          );
        })}
      </div>

      <section className="rounded-lg border bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search company or buyer…" className="h-8 pl-8" /></div>
          <Popover>
            <PopoverTrigger asChild><Button size="sm" variant="outline" className="h-8"><Filter />Filters{nFilters ? ` · ${nFilters}` : ""}</Button></PopoverTrigger>
            <PopoverContent align="start" className="w-80 space-y-3">
              <div><p className="mb-1.5 text-xs font-medium">Market</p><ChipSelect options={MARKETS} value={markets} onChange={setMarkets} /></div>
              <div><p className="mb-1.5 text-xs font-medium">Category</p><ChipSelect options={CATS} value={cats} onChange={setCats} /></div>
              <div><p className="mb-1.5 text-xs font-medium">Tier</p><ChipSelect options={TIERS} value={tiers} onChange={setTiers} /></div>
              <Button size="sm" variant="ghost" onClick={() => { setMarkets([]); setCats([]); setTiers([]); }}>Clear filters</Button>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="h-8"><Columns3 />Columns</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              {COLS.map((c) => <DropdownMenuCheckboxItem key={c} checked={show(c)} onCheckedChange={(v) => setHidden(v ? hidden.filter((x) => x !== c) : [...hidden, c])} onSelect={(e) => e.preventDefault()}>{c}</DropdownMenuCheckboxItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          {sel.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="font-medium">{sel.length} selected</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="h-8">Change status</Button></DropdownMenuTrigger>
                <DropdownMenuContent>{PIPELINE_STAGES.map((s) => <DropdownMenuItem key={s} onClick={() => { sel.forEach((id) => setStatus(id, s)); setSel([]); toast.success(`Moved ${sel.length} to ${s}`); }}>{s}</DropdownMenuItem>)}</DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm" variant="outline" className="h-8" onClick={() => { sel.forEach((id) => updateLead(id, { sheetSync: "Marked for sync" })); toast.success("Marked for Google Sheets sync"); setSel([]); }}>Mark for sync</Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => exportLeads(leads.filter((l) => sel.includes(l.id)), "qualified-selected")}><Download />Export</Button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Star className="size-5" />} title="No leads in this view" body="Try another saved view or clear filters." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="w-10 px-3 py-2"><Checkbox aria-label="Select page" checked={pageRows.every((r) => sel.includes(r.l.id))} onCheckedChange={(c) => setSel(c ? [...new Set([...sel, ...pageRows.map((r) => r.l.id)])] : sel.filter((x) => !pageRows.some((r) => r.l.id === x)))} /></th>
                  <th className="px-2 py-2 font-medium"><SortBtn k="company">Company</SortBtn></th>
                  {show("Buyer") && <th className="px-2 py-2 font-medium">Primary buyer</th>}
                  {show("Market") && <th className="px-2 py-2 font-medium">Market</th>}
                  {show("Category") && <th className="px-2 py-2 font-medium">Category</th>}
                  {show("Score") && <th className="px-2 py-2 font-medium"><SortBtn k="score">Score</SortBtn></th>}
                  {show("Tier") && <th className="px-2 py-2 font-medium">Tier</th>}
                  {show("Opportunity") && <th className="px-2 py-2 font-medium">Design opportunity</th>}
                  {show("Potential") && <th className="px-2 py-2 font-medium"><SortBtn k="potential">Est. potential</SortBtn></th>}
                  {show("Research") && <th className="px-2 py-2 font-medium">Research</th>}
                  {show("Outreach") && <th className="px-2 py-2 font-medium">Outreach</th>}
                  {show("Last activity") && <th className="px-2 py-2 font-medium"><SortBtn k="activity">Last activity</SortBtn></th>}
                  {show("Owner") && <th className="px-2 py-2 font-medium">Owner</th>}
                  <th className="w-10" />
                </tr></thead>
                <tbody>
                  {pageRows.map(({ l, score, tier, completeness }) => (
                    <tr key={l.id} className="cursor-pointer border-b last:border-0 hover:bg-muted/40" onClick={() => setPreview(l.id)}>
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Select ${l.company}`} checked={sel.includes(l.id)} onCheckedChange={(c) => setSel(c ? [...sel, l.id] : sel.filter((x) => x !== l.id))} /></td>
                      <td className="px-2 py-2"><span className="flex items-center gap-2"><CompanyAvatar name={l.company} size="sm" /><span className="font-medium">{l.company}</span></span></td>
                      {show("Buyer") && <td className="px-2 py-2"><span className="block">{l.buyer.name}</span><span className="text-xs text-muted-foreground">{l.buyer.role}</span></td>}
                      {show("Market") && <td className="px-2 py-2 text-muted-foreground">{l.market}</td>}
                      {show("Category") && <td className="px-2 py-2">{l.category}</td>}
                      {show("Score") && <td className="px-2 py-2"><ScoreBadge score={score} tier={tier} /></td>}
                      {show("Tier") && <td className="px-2 py-2"><TierBadge tier={tier} /></td>}
                      {show("Opportunity") && <td className="px-2 py-2"><Pill>{l.designArea}</Pill></td>}
                      {show("Potential") && <td className="tabular px-2 py-2">{l.estRetainer ? <>{fmtMoney(l.estRetainer)}<span className="text-xs text-muted-foreground">/mo est.</span></> : "—"}</td>}
                      {show("Research") && <td className="px-2 py-2"><span className="flex items-center gap-1.5"><span className="h-1 w-10 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-primary" style={{ width: `${completeness}%` }} /></span><span className="tabular text-xs text-muted-foreground">{completeness}%</span></span></td>}
                      {show("Outreach") && <td className="px-2 py-2"><StatusBadge status={l.status} /></td>}
                      {show("Last activity") && <td className="px-2 py-2 text-xs text-muted-foreground">{relTime(l.lastActivity)}</td>}
                      {show("Owner") && <td className="px-2 py-2 text-xs">{l.owner}</td>}
                      <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-7" aria-label="Row actions"><MoreHorizontal /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreview(l.id)}>Quick preview</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate({ to: "/leads/$id", params: { id: l.id } })}>Open profile</DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>{PIPELINE_STAGES.map((s) => <DropdownMenuItem key={s} onClick={() => { setStatus(l.id, s); toast.success(`${l.company} → ${s}`); }}>{s}</DropdownMenuItem>)}</DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">Sheets: {l.sheetSync}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { updateLead(l.id, { sheetSync: "Marked for sync" }); toast.success("Marked for sync"); }}>Mark for sync</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y md:hidden">
              {pageRows.map(({ l, score, tier }) => (
                <li key={l.id}>
                  <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setPreview(l.id)}>
                    <CompanyAvatar name={l.company} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{l.company}</p>
                      <p className="text-xs text-muted-foreground">{l.buyer.name} · {l.market}</p>
                      <div className="mt-1 flex gap-1"><TierBadge tier={tier} /><StatusBadge status={l.status} /></div>
                    </div>
                    <span className="tabular text-lg font-semibold">{score}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
              <span>{pg * pageSize + 1}–{Math.min(filtered.length, (pg + 1) * pageSize)} of {filtered.length}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Previous</Button>
                <Button size="sm" variant="outline" className="h-7" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </section>
      <LeadDrawer id={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
