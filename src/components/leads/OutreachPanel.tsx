import { useState } from "react";
import { Copy, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChipSelect, DemoLabel, Panel } from "@/components/shared/bits";
import { draftOutreach } from "@/lib/outreach";
import { log, updateLead, uid, now } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import type { Lead, OutreachChannel } from "@/types";

const CHANNELS: OutreachChannel[] = ["LinkedIn connection", "LinkedIn DM", "Cold email", "Follow-up"];

export function OutreachPanel({ lead }: { lead: Lead }) {
  const [channel, setChannel] = useState<OutreachChannel>("LinkedIn DM");
  const [variant, setVariant] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = (v: number) => {
    setLoading(true);
    setTimeout(() => {
      setText(draftOutreach(lead, channel, v));
      setVariant(v);
      setLoading(false);
      log({ type: "Outreach", title: `${channel} drafted`, subject: lead.company, leadId: lead.id, outcome: "Success", details: "Simulated draft generated from mock evidence." });
    }, 700);
  };

  const evidence = [
    `${lead.buyer.name}, ${lead.buyer.role} (${lead.buyer.verification.toLowerCase()})`,
    lead.research?.opportunities.find((o) => o.kind === "Observed")?.title ?? lead.designGap,
    ...(lead.research?.recentActivity.slice(0, 1) ?? []),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Panel title="Draft outreach" action={<DemoLabel>Simulated generation</DemoLabel>}>
        <ChipSelect options={CHANNELS} value={[channel]} single onChange={(v) => { setChannel(v[0]); setText(""); }} />
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2 rounded-md border p-3">
              {[90, 75, 85, 40].map((w) => <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />)}
            </div>
          ) : text ? (
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={channel === "Cold email" ? 14 : 8} className="font-mono text-[13px] leading-relaxed" />
          ) : (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Generate a {channel.toLowerCase()} draft personalised with {lead.company}'s evidence.
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!text ? (
            <Button size="sm" onClick={() => generate(0)} disabled={loading}><Sparkles /> Generate draft</Button>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => generate(variant + 1)} disabled={loading}><RefreshCw /> Regenerate</Button>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(text); toast.success("Copied to clipboard"); }}><Copy /> Copy</Button>
              <Button size="sm" onClick={() => {
                updateLead(lead.id, (l) => ({ drafts: [{ id: uid("D"), channel, text, at: now() }, ...l.drafts] }));
                toast.success("Draft saved to outreach history");
              }}><Save /> Save draft</Button>
            </>
          )}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Nothing is sent. Copy the text into LinkedIn or email manually.</p>
      </Panel>
      <div className="space-y-4">
        <Panel title="Evidence used">
          <ul className="space-y-2 text-sm">
            {evidence.map((e) => <li key={e} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-primary" />{e}</li>)}
          </ul>
        </Panel>
        <Panel title="Saved drafts">
          {lead.drafts.length === 0 ? <p className="text-sm text-muted-foreground">No saved drafts yet.</p> : (
            <ul className="space-y-2">
              {lead.drafts.map((d) => (
                <li key={d.id}>
                  <button className="w-full rounded-md border p-2 text-left hover:bg-accent" onClick={() => { setChannel(d.channel); setText(d.text); }}>
                    <p className="text-xs font-medium">{d.channel}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtDateTime(d.at)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
