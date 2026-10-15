import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChipSelect, PageHeader, Panel } from "@/components/shared/bits";
import { resetDemo, setState, useApp, type GeneralSettings } from "@/lib/store";
import type { Market } from "@/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — EpicAura Lead Agent" },
      { name: "description", content: "Workspace, discovery defaults, notifications, and demo data settings." },
      { property: "og:title", content: "Settings — EpicAura Lead Agent" },
      { property: "og:description", content: "Workspace, discovery defaults, notifications, and demo data settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useApp((x) => x.settings);
  const set = (p: Partial<GeneralSettings>) => setState((st) => ({ ...st, settings: { ...st.settings, ...p } }));
  const [name, setName] = useState(s.workspaceName);
  const Toggle = ({ k, label, hint }: { k: keyof GeneralSettings; label: string; hint?: string }) => (
    <label className="flex items-center justify-between gap-3 text-sm"><span>{label}{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</span><Switch checked={s[k] as boolean} onCheckedChange={(v) => { set({ [k]: v }); toast.success("Saved"); }} /></label>
  );
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Settings" description="Preferences for this demo workspace. Stored in your browser only." />
      <Panel title="Workspace profile" bodyClass="space-y-3">
        <div className="space-y-1"><Label htmlFor="ws">Workspace name</Label><div className="flex gap-2"><Input id="ws" value={name} onChange={(e) => setName(e.target.value)} /><Button variant="outline" onClick={() => { if (!name.trim()) return toast.error("Name required"); set({ workspaceName: name.trim() }); toast.success("Workspace updated"); }}>Save</Button></div></div>
        <div className="space-y-1"><Label>Default owner</Label><Select value={s.ownerName} onValueChange={(v) => set({ ownerName: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Damani B.">Damani B.</SelectItem><SelectItem value="Alicia M.">Alicia M.</SelectItem></SelectContent></Select></div>
      </Panel>
      <Panel title="Discovery defaults" bodyClass="space-y-4">
        <div><p className="mb-1.5 text-xs font-medium">Default target markets</p><ChipSelect options={["United States", "Jamaica", "Wider Caribbean"] as Market[]} value={s.defaultMarkets} onChange={(v) => set({ defaultMarkets: v })} /></div>
        <div><p className="mb-2 flex justify-between text-xs font-medium"><span>Default minimum score</span><span className="tabular">{s.defaultMinScore}</span></p><Slider value={[s.defaultMinScore]} max={100} step={5} onValueChange={([v]) => set({ defaultMinScore: v })} /></div>
        <div><p className="mb-2 flex justify-between text-xs font-medium"><span>Default prospects to review</span><span className="tabular">{s.defaultMax}</span></p><Slider value={[s.defaultMax]} min={5} max={50} step={5} onValueChange={([v]) => set({ defaultMax: v })} /></div>
      </Panel>
      <Panel title="Table display" bodyClass="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Rows per page</Label><Select value={String(s.pageSize)} onValueChange={(v) => set({ pageSize: Number(v) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[5, 10, 25].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1"><Label>Density</Label><Select value={s.density} onValueChange={(v) => set({ density: v as GeneralSettings["density"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Comfortable">Comfortable</SelectItem><SelectItem value="Compact">Compact</SelectItem></SelectContent></Select></div>
      </Panel>
      <Panel title="Notifications" bodyClass="space-y-3">
        <Toggle k="notifyResearch" label="Research completed" />
        <Toggle k="notifyReplies" label="Prospect replies" />
        <Toggle k="notifySync" label="Demo sync results" />
      </Panel>
      <Panel title="Google Sheets & export" bodyClass="space-y-3">
        <Toggle k="sheetsAutoMark" label="Auto-mark newly qualified leads for sync" />
        <Toggle k="includeEvidence" label="Include evidence URLs in exports" />
        <div className="space-y-1"><Label>Export format</Label><Select value={s.exportFormat} onValueChange={(v) => set({ exportFormat: v as "CSV" | "JSON" })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CSV">CSV</SelectItem><SelectItem value="JSON">JSON</SelectItem></SelectContent></Select></div>
      </Panel>
      <Panel title="Demo data">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Restore all prospects, sessions, settings, and activity to the original demo state.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" className="text-destructive"><RotateCcw />Reset demo data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Reset all demo data?</AlertDialogTitle><AlertDialogDescription>Your changes in this browser will be lost.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { resetDemo(); setName("EpicAura Studio"); toast.success("Demo data reset"); }}>Reset</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Panel>
    </div>
  );
}
