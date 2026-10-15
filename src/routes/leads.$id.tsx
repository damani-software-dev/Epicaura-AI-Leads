import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, MessageSquarePlus, Pencil, RefreshCw, Send, Sheet as SheetIcon, Star, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CompanyAvatar, EmptyState, PageHeader, Panel, Pill, StatusBadge } from "@/components/shared/bits";
import { ScoreBreakdown } from "@/components/leads/ScoreBreakdown";
import { OutreachPanel } from "@/components/leads/OutreachPanel";
import { ResearchDetail } from "@/components/research/ResearchDetail";
import { completeResearch, log, now, qualifyLead, setState, setStatus, uid, updateLead, useApp } from "@/lib/store";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import { exportLeads } from "@/lib/export";
import { LEAD_STATUSES, type Lead } from "@/types";

export const Route = createFileRoute("/leads/$id")({
  head: () => ({
    meta: [
      { title: "Lead Profile — EpicAura Lead Agent" },
      { name: "description", content: "Company, buyer, evidence, score, and outreach for a prospect." },
      { property: "og:title", content: "Lead Profile — EpicAura Lead Agent" },
      { property: "og:description", content: "Company, buyer, evidence, score, and outreach for a prospect." },
    ],
  }),
  component: LeadProfile,
});

function LeadProfile() {
  const { id } = Route.useParams();
  const lead = useApp((s) => s.leads.find((l) => l.id === id));
  const allActs = useApp((s) => s.activities);
  const activities = useMemo(() => allActs.filter((a) => a.leadId === id), [allActs, id]);
  const navigate = useNavigate();
  const [edit, setEdit] = useState<Lead | null>(null);
  const [note, setNote] = useState("");
  const [del, setDel] = useState(false);
  const [rerun, setRerun] = useState(false);
  const [tab, setTab] = useState("research");

  if (!lead) return <Panel><EmptyState icon={<XCircle className="size-5" />} title="Lead not found" body="It may have been deleted." action={<Button asChild size="sm"><Link to="/qualified">Back to Qualified Leads</Link></Button>} /></Panel>;

  return (
    <div className="mx-auto max-w-7xl">
      <Link to="/qualified" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" />Qualified Leads</Link>
      <PageHeader
        title=""
        actions={null}
      />
      <section className="-mt-6 mb-4 rounded-lg border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-start gap-4">
          <CompanyAvatar name={lead.company} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold tracking-tight">{lead.company}</h1><StatusBadge status={lead.status} /><Pill>{lead.id}</Pill></div>
            <a href={`https://${lead.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">{lead.domain}<ExternalLink className="size-3" /></a>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lead.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={lead.status} onValueChange={(v) => { setStatus(lead.id, v as Lead["status"]); toast.success(`Status: ${v}`); }}>
              <SelectTrigger className="h-8 w-40" aria-label="Change status"><SelectValue /></SelectTrigger>
              <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setEdit(lead)}><Pencil />Edit</Button>
            <Button size="sm" onClick={() => setTab("outreach")}><Send />Prepare outreach</Button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="ghost" disabled={rerun} onClick={() => { setRerun(true); setTimeout(() => { completeResearch(lead.id, 1); setRerun(false); toast.success("Qualification re-run (simulated)"); }, 1200); }}><RefreshCw className={rerun ? "animate-spin" : ""} />Re-run qualification</Button>
          {!lead.qualified && <Button size="sm" variant="ghost" onClick={() => { const r = qualifyLead(lead.id); r.ok ? toast.success("Marked as qualified") : toast.warning("Below threshold", { description: r.reason }); }}><Star />Mark qualified</Button>}
          {lead.status !== "Rejected" && <Button size="sm" variant="ghost" onClick={() => { setStatus(lead.id, "Rejected"); toast("Marked rejected"); }}><XCircle />Reject</Button>}
          <Button size="sm" variant="ghost" onClick={() => { updateLead(lead.id, { sheetSync: "Marked for sync" }); toast.success("Marked for Google Sheets sync"); }}><SheetIcon />Mark for sync</Button>
          <Button size="sm" variant="ghost" onClick={() => exportLeads([lead], lead.company.toLowerCase())}>Export</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => setDel(true)}><Trash2 />Delete</Button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="research">Research & evidence</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
            <TabsTrigger value="notes">Notes ({lead.notes.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="research" className="mt-3"><Panel><ResearchDetail lead={lead} /></Panel></TabsContent>
          <TabsContent value="outreach" className="mt-3"><OutreachPanel lead={lead} /></TabsContent>
          <TabsContent value="notes" className="mt-3">
            <Panel>
              <div className="flex gap-2">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note…" rows={2} />
                <Button size="sm" disabled={!note.trim()} onClick={() => { updateLead(lead.id, (l) => ({ notes: [{ id: uid("n"), text: note.trim(), at: now() }, ...l.notes] })); setNote(""); toast.success("Note added"); }}><MessageSquarePlus />Add</Button>
              </div>
              <ul className="mt-4 space-y-3">
                {lead.notes.map((n) => <li key={n.id} className="rounded-md border p-3 text-sm"><p>{n.text}</p><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(n.at)}</p></li>)}
                {lead.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              </ul>
            </Panel>
          </TabsContent>
          <TabsContent value="timeline" className="mt-3">
            <Panel>
              {activities.length === 0 ? <p className="text-sm text-muted-foreground">No activity recorded yet.</p> : (
                <ol className="relative space-y-4 border-l pl-4">
                  {activities.map((a) => <li key={a.id}><span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full border-2 border-card bg-primary" /><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(a.at)} · {a.details}</p></li>)}
                </ol>
              )}
            </Panel>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <Panel title="Qualification score"><ScoreBreakdown lead={lead} /></Panel>
          <Panel title="Details">
            <dl className="space-y-2 text-sm">
              {([
                ["Buyer", `${lead.buyer.name} · ${lead.buyer.role}`],
                ["Contact", lead.buyer.email ?? "No public email found"],
                ["Verification", lead.buyer.verification],
                ["Market", `${lead.country}`],
                ["Stage / size", `${lead.stage} · ${lead.teamSize}`],
                ["AI signal", lead.aiSignal],
                ["Est. retainer", lead.estRetainer ? `${fmtMoney(lead.estRetainer)}/mo (estimate)` : "—"],
                ["Next action", lead.nextAction],
                ["Follow-up", fmtDate(lead.followUp)],
                ["Owner", lead.owner],
                ["Sheets sync", lead.sheetSync],
              ] as const).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>)}
            </dl>
          </Panel>
        </div>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit lead details</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <div className="space-y-1"><Label>Company</Label><Input value={edit.company} onChange={(e) => setEdit({ ...edit, company: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Buyer name</Label><Input value={edit.buyer.name} onChange={(e) => setEdit({ ...edit, buyer: { ...edit.buyer, name: e.target.value } })} /></div>
                <div className="space-y-1"><Label>Est. retainer (USD/mo)</Label><Input type="number" value={edit.estRetainer ?? ""} onChange={(e) => setEdit({ ...edit, estRetainer: e.target.value ? Number(e.target.value) : undefined })} /></div>
              </div>
              <div className="space-y-1"><Label>Next action</Label><Input value={edit.nextAction} onChange={(e) => setEdit({ ...edit, nextAction: e.target.value })} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => { if (!edit?.company.trim()) return toast.error("Company name is required"); updateLead(lead.id, { company: edit.company, buyer: edit.buyer, estRetainer: edit.estRetainer, nextAction: edit.nextAction, description: edit.description }); setEdit(null); toast.success("Lead updated"); }}>Save changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={del} onOpenChange={setDel}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete {lead.company}?</AlertDialogTitle><AlertDialogDescription>This removes the lead, its notes, and drafts from the demo workspace.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { setState((s) => ({ ...s, leads: s.leads.filter((l) => l.id !== lead.id) })); log({ type: "Prospect", title: "Lead deleted", subject: lead.company, outcome: "Warning", details: "Removed from demo workspace." }); navigate({ to: "/qualified" }); toast("Lead deleted"); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
