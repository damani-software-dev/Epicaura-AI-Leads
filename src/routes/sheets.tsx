import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, FilePlus2, Link2, Loader2, RefreshCw, Sheet as SheetIcon, Unplug, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DemoLabel, PageHeader, Panel, Pill } from "@/components/shared/bits";
import { getState, log, now, setState, uid, updateLead, useApp } from "@/lib/store";
import { overallScore, tierFor } from "@/lib/scoring";
import { fmtDate, fmtDateTime } from "@/lib/format";
import type { Lead } from "@/types";

export const Route = createFileRoute("/sheets")({
  head: () => ({
    meta: [
      { title: "Google Sheets — EpicAura Lead Agent" },
      { name: "description", content: "Preview how qualified leads will sync to Google Sheets (demo)." },
      { property: "og:title", content: "Google Sheets — EpicAura Lead Agent" },
      { property: "og:description", content: "Preview how qualified leads will sync to Google Sheets (demo)." },
    ],
  }),
  component: Sheets,
});

function cell(l: Lead, key: string): string {
  const s = getState(); const score = overallScore(l.scores, s.weights);
  const m: Record<string, string> = {
    id: l.id, company: l.company, website: l.domain ? `https://${l.domain}` : "", country: l.country, market: l.market, category: l.category,
    stage: l.stage, teamSize: l.teamSize, aiSignal: l.aiSignal, buyer: l.buyer.name, role: l.buyer.role, email: l.buyer.email ?? "",
    profile: l.buyer.profileUrl, icpScore: String(Math.round(l.scores.icp * s.weights.icp)), designScore: String(Math.round(l.scores.design * s.weights.design)),
    commercialScore: String(Math.round(l.scores.commercial * s.weights.commercial)), score: String(score), tier: tierFor(score, s.thresholds),
    opportunity: l.designGap, summary: l.research?.summary.fit ?? "", evidence: l.research?.evidenceUrls.join(" ") ?? "",
    researchStatus: l.researchStatus, status: l.status, nextAction: l.nextAction, lastResearched: fmtDate(l.lastResearched), updated: fmtDate(l.lastActivity),
  };
  return m[key] ?? "";
}

function Sheets() {
  const sh = useApp((s) => s.sheets);
  const leads = useApp((s) => s.leads);
  const [connectOpen, setConnectOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [failNext, setFailNext] = useState(false);
  const qualified = leads.filter((l) => l.qualified);
  const [chosen, setChosen] = useState<string[] | null>(null);
  const exportIds = chosen ?? qualified.filter((l) => l.sheetSync === "Marked for sync" || l.sheetSync === "Demo synced").map((l) => l.id);
  const ss = sh.spreadsheets.find((x) => x.id === sh.spreadsheetId) ?? sh.spreadsheets[0];
  const ws = ss.worksheets.find((w) => w.id === sh.worksheetId) ?? ss.worksheets[0];
  const cols = sh.mappings.filter((m) => m.enabled);
  const pending = qualified.filter((l) => l.sheetSync === "Marked for sync").length;
  const setSheets = (p: Partial<typeof sh>) => setState((s) => ({ ...s, sheets: { ...s.sheets, ...p } }));

  const preview = useMemo(() => {
    const rows = leads.filter((l) => exportIds.includes(l.id));
    return rows.map((l) => {
      const missingReq = !l.domain;
      const missingOpt = cols.filter((c) => !c.required && !cell(l, c.key)).map((c) => c.label);
      const action: "New" | "Update" | "Skip" = missingReq ? "Skip" : sh.mode === "update" && l.sheetSync === "Demo synced" ? "Update" : "New";
      return { l, action, missingOpt };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, exportIds.join(), cols.length, sh.mode]);
  const counts = { New: preview.filter((p) => p.action === "New").length, Update: preview.filter((p) => p.action === "Update").length, Skip: preview.filter((p) => p.action === "Skip").length };
  const warnings = preview.filter((p) => p.missingOpt.length).length;

  const moveCol = (i: number, d: -1 | 1) => {
    const m = [...sh.mappings]; const j = i + d; if (j < 0 || j >= m.length) return;
    [m[i], m[j]] = [m[j], m[i]]; setSheets({ mappings: m });
  };

  const sync = () => {
    if (!preview.length) return toast.error("Select at least one lead to export");
    setSyncing(0);
    let p = 0;
    const t = setInterval(() => {
      p += 20; setSyncing(p);
      if (p >= 100) {
        clearInterval(t); setSyncing(null);
        const failed = failNext; setFailNext(false);
        const run = { id: uid("R"), at: now(), spreadsheet: ss.name, worksheet: ws.name, processed: failed ? 0 : counts.New + counts.Update, created: failed ? 0 : counts.New, updated: failed ? 0 : counts.Update, skipped: counts.Skip, outcome: failed ? "Failed" as const : "Success" as const, details: failed ? "Demo Sync failed: simulated rate limit. No rows changed." : `Demo Sync — ${sh.mode === "update" ? "update existing by Lead ID" : "append only"}.` };
        setSheets({ runs: [run, ...getState().sheets.runs], lastSync: failed ? getState().sheets.lastSync : run.at });
        if (!failed) preview.filter((x) => x.action !== "Skip").forEach((x) => updateLead(x.l.id, { sheetSync: "Demo synced" }));
        log({ type: "Sheets sync", title: failed ? "Demo sync failed" : "Demo sync completed", subject: ss.name, outcome: failed ? "Failed" : "Success", details: run.details + ` ${run.created} new, ${run.updated} updated, ${run.skipped} skipped.` });
        failed ? toast.error("Demo sync failed", { description: "Simulated error — try again." }) : toast.success(`Demo sync complete: ${run.processed} records`, { description: `${run.created} new · ${run.updated} updated · ${run.skipped} skipped` });
      }
    }, 350);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Google Sheets" description="Push qualified leads to a shared spreadsheet. This prototype simulates the integration — no Google account is connected." actions={<DemoLabel>Demo Sync · not connected to Google</DemoLabel>} />

      <div className="grid gap-4 lg:grid-cols-4">
        <Panel className="lg:col-span-2">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border bg-success-soft text-success"><SheetIcon className="size-5" /></span>
            <div className="flex-1">
              <div className="flex items-center gap-2"><p className="font-semibold">Google Sheets</p>{sh.connected ? <Pill tone="warning" dot>Demo connected</Pill> : <Pill dot>Not Connected</Pill>}</div>
              <p className="mt-1 text-sm text-muted-foreground">When live, qualified leads and their scores will sync into a sheet your team already uses, keyed by Lead ID so rows are updated rather than duplicated.</p>
              <div className="mt-3">{sh.connected ? <Button size="sm" variant="outline" onClick={() => { setSheets({ connected: false }); toast("Demo connection removed"); }}><Unplug />Disconnect demo</Button> : <Button size="sm" onClick={() => setConnectOpen(true)}><Link2 />Connect Google Sheets</Button>}</div>
            </div>
          </div>
        </Panel>
        <Panel><p className="text-xs text-muted-foreground">Last demo sync</p><p className="mt-1 text-lg font-semibold">{fmtDateTime(sh.lastSync)}</p><p className="text-xs text-muted-foreground">{sh.runs[0]?.processed ?? 0} records in last run</p></Panel>
        <Panel><p className="text-xs text-muted-foreground">Awaiting export</p><p className="tabular mt-1 text-lg font-semibold">{pending}</p><p className="text-xs text-muted-foreground">Leads marked for sync</p></Panel>
      </div>

      {sh.connected ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <Panel title="Destination">
              <div className="space-y-3">
                <div className="space-y-1"><Label>Spreadsheet</Label>
                  <Select value={ss.id} onValueChange={(v) => setSheets({ spreadsheetId: v, worksheetId: sh.spreadsheets.find((x) => x.id === v)!.worksheets[0].id })}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sh.spreadsheets.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Worksheet</Label>
                  <Select value={ws.id} onValueChange={(v) => setSheets({ worksheetId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ss.worksheets.map((w) => <SelectItem key={w.id} value={w.id}>{w.name} · {w.rows} rows</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {creating ? (
                  <div className="flex gap-2"><Input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Spreadsheet name" /><Button size="sm" onClick={() => {
                    if (!newName.trim()) return;
                    const id = uid("SS"); const wid = uid("W");
                    setSheets({ spreadsheets: [...sh.spreadsheets, { id, name: newName.trim(), worksheets: [{ id: wid, name: "Sheet1", rows: 0 }] }], spreadsheetId: id, worksheetId: wid });
                    setCreating(false); setNewName(""); toast.success("Demo spreadsheet created");
                  }}>Create</Button></div>
                ) : <Button size="sm" variant="outline" onClick={() => setCreating(true)}><FilePlus2 />Create simulated spreadsheet</Button>}
                <div className="space-y-1.5 pt-1"><Label>Sync mode</Label>
                  <RadioGroup value={sh.mode} onValueChange={(v) => setSheets({ mode: v as "append" | "update" })}>
                    <label className="flex items-start gap-2 text-sm"><RadioGroupItem value="update" className="mt-0.5" /><span>Update existing records<span className="block text-xs text-muted-foreground">Match rows by Lead ID; no duplicates</span></span></label>
                    <label className="flex items-start gap-2 text-sm"><RadioGroupItem value="append" className="mt-0.5" /><span>Append only<span className="block text-xs text-muted-foreground">Always add new rows</span></span></label>
                  </RadioGroup>
                </div>
              </div>
            </Panel>
            <Panel title="Column mapping" action={<span className="text-xs text-muted-foreground">{cols.length} of {sh.mappings.length}</span>} bodyClass="p-0">
              <ul className="max-h-96 divide-y overflow-y-auto">
                {sh.mappings.map((m, i) => (
                  <li key={m.key} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                    <Switch checked={m.enabled} disabled={m.required} onCheckedChange={(v) => setSheets({ mappings: sh.mappings.map((x) => (x.key === m.key ? { ...x, enabled: v } : x)) })} aria-label={`Toggle ${m.label}`} />
                    <span className="flex-1">{m.label}{m.required && <span className="ml-1 text-[10px] text-muted-foreground">required</span>}</span>
                    <button aria-label="Move up" onClick={() => moveCol(i, -1)} className="rounded p-0.5 text-muted-foreground hover:bg-accent"><ArrowUp className="size-3.5" /></button>
                    <button aria-label="Move down" onClick={() => moveCol(i, 1)} className="rounded p-0.5 text-muted-foreground hover:bg-accent"><ArrowDown className="size-3.5" /></button>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel title="Leads to export" action={<div className="flex gap-2"><Button size="sm" variant="ghost" className="h-7" onClick={() => setChosen(qualified.map((l) => l.id))}>All qualified</Button><Button size="sm" variant="ghost" className="h-7" onClick={() => setChosen([])}>None</Button></div>}>
              <div className="flex flex-wrap gap-1.5">
                {qualified.map((l) => {
                  const on = exportIds.includes(l.id);
                  return <label key={l.id} className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${on ? "border-primary/40 bg-primary-soft" : ""}`}><Checkbox checked={on} onCheckedChange={(c) => setChosen(c ? [...exportIds, l.id] : exportIds.filter((x) => x !== l.id))} />{l.company}</label>;
                })}
              </div>
            </Panel>
            <Panel title={`Sync preview → ${ss.name} / ${ws.name}`} bodyClass="p-0" action={<DemoLabel>Demo Sync</DemoLabel>}>
              <div className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4">
                {([["New records", counts.New], ["Updates", counts.Update], ["Skipped", counts.Skip], ["Warnings", warnings]] as const).map(([k, v]) => <div key={k} className="bg-card px-4 py-2.5"><p className="text-xs text-muted-foreground">{k}</p><p className="tabular text-lg font-semibold">{v}</p></div>)}
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted"><tr><th className="px-2 py-1.5 text-left font-medium">Action</th>{cols.map((c) => <th key={c.key} className="whitespace-nowrap px-2 py-1.5 text-left font-medium">{c.label}</th>)}</tr></thead>
                  <tbody>
                    {preview.map(({ l, action, missingOpt }) => (
                      <tr key={l.id} className="border-b">
                        <td className="px-2 py-1.5"><Pill tone={action === "New" ? "success" : action === "Update" ? "info" : "neutral"}>{action}</Pill>{missingOpt.length > 0 && <span title={`Missing: ${missingOpt.join(", ")}`}><AlertTriangle className="ml-1 inline size-3 text-warning" /></span>}</td>
                        {cols.map((c) => <td key={c.key} className="max-w-[200px] truncate whitespace-nowrap px-2 py-1.5">{cell(l, c.key) || <span className="text-muted-foreground">—</span>}</td>)}
                      </tr>
                    ))}
                    {preview.length === 0 && <tr><td colSpan={cols.length + 1} className="px-4 py-8 text-center text-muted-foreground">No leads selected.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t p-3">
                {syncing != null ? <div className="flex flex-1 items-center gap-3"><Loader2 className="size-4 animate-spin text-primary" /><Progress value={syncing} className="flex-1" /><span className="tabular text-xs">{syncing}%</span></div> : (
                  <>
                    <Button onClick={sync}><RefreshCw />Sync Now (Demo)</Button>
                    <Button variant="outline" onClick={() => { log({ type: "Sheets preview", title: "Sync preview completed", subject: ss.name, outcome: "Info", details: `Demo preview: ${counts.New} new, ${counts.Update} updates, ${counts.Skip} skipped.` }); toast.success("Preview logged"); }}>Save preview</Button>
                    <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={failNext} onCheckedChange={setFailNext} />Simulate failure</label>
                  </>
                )}
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <Panel className="mt-4"><p className="text-sm text-muted-foreground">Connect (demo) to choose a spreadsheet, map columns, and preview exports.</p></Panel>
      )}

      <Panel className="mt-4" title="Sync history" bodyClass="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="px-4 py-2 font-medium">Date</th><th className="px-2 py-2 font-medium">Spreadsheet</th><th className="px-2 py-2 font-medium">Worksheet</th><th className="px-2 py-2 font-medium">Processed</th><th className="px-2 py-2 font-medium">Outcome</th><th className="px-4 py-2 font-medium">Details</th></tr></thead>
            <tbody>{sh.runs.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-2 text-xs">{fmtDateTime(r.at)}</td><td className="px-2 py-2">{r.spreadsheet}</td><td className="px-2 py-2">{r.worksheet}</td>
                <td className="tabular px-2 py-2">{r.processed} <span className="text-xs text-muted-foreground">({r.created} new · {r.updated} upd · {r.skipped} skip)</span></td>
                <td className="px-2 py-2">{r.outcome === "Success" ? <Pill tone="success"><CheckCircle2 className="size-3" />Success</Pill> : <Pill tone="danger"><XCircle className="size-3" />Failed</Pill>}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{r.details}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Panel>

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Google Sheets</DialogTitle>
            <DialogDescription>Real Google authorization isn't implemented in this prototype. No account, credentials, or Google APIs are used.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">You can switch to a clearly labeled demo-connected state to explore spreadsheet selection, column mapping, previews, and simulated syncs.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectOpen(false)}>Cancel</Button>
            <Button onClick={() => { setSheets({ connected: true }); setConnectOpen(false); log({ type: "Configuration", title: "Google Sheets demo connection", subject: "Google Sheets", outcome: "Info", details: "Switched to demo-connected state. No real authorization." }); toast.success("Demo connection enabled"); }}>Simulate Connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
