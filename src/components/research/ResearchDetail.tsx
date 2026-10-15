import { Bot, Building2, ExternalLink, FileSearch, Lightbulb, Package, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyAvatar, DemoLabel, EmptyState, Pill } from "@/components/shared/bits";
import { fmtDate } from "@/lib/format";
import type { Lead } from "@/types";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="min-w-0">{v}</span>
    </div>
  );
}
const Ext = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-primary hover:underline">
    {href.replace(/^https?:\/\//, "")}<ExternalLink className="size-3 shrink-0" />
  </a>
);

export function ResearchDetail({ lead }: { lead: Lead }) {
  const r = lead.research;
  return (
    <Tabs defaultValue="overview">
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="overview"><Building2 className="size-3.5" />Overview</TabsTrigger>
        <TabsTrigger value="product"><Package className="size-3.5" />Product</TabsTrigger>
        <TabsTrigger value="ai"><Bot className="size-3.5" />AI signals</TabsTrigger>
        <TabsTrigger value="audit"><Lightbulb className="size-3.5" />UX audit</TabsTrigger>
        <TabsTrigger value="buyer"><UserRound className="size-3.5" />Buyer</TabsTrigger>
        <TabsTrigger value="summary"><FileSearch className="size-3.5" />Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <div className="mb-3 flex items-center gap-3">
          <CompanyAvatar name={lead.company} size="lg" />
          <div>
            <p className="font-semibold">{lead.company}</p>
            <Ext href={`https://${lead.domain}`} />
          </div>
        </div>
        <Row k="Description" v={lead.description} />
        <Row k="Category" v={lead.category} />
        <Row k="Location" v={`${lead.country} · ${lead.market}`} />
        <Row k="Team size" v={`${lead.teamSize} (estimated)`} />
        <Row k="Stage" v={lead.stage} />
        <Row k="Target audience" v={lead.audience} />
        <Row k="Decision-maker" v={`${lead.buyer.name}, ${lead.buyer.role}`} />
      </TabsContent>

      {!r ? (
        ["product", "ai", "audit", "buyer", "summary"].map((t) => (
          <TabsContent key={t} value={t}>
            <EmptyState icon={<FileSearch className="size-5" />} title="Research not run yet" body="Start research to generate mock findings for this prospect." />
          </TabsContent>
        ))
      ) : (
        <>
          <TabsContent value="product" className="mt-4">
            <Row k="What it does" v={r.whatItDoes} />
            <Row k="Who it serves" v={r.serves} />
            <Row k="Main features" v={<ul className="list-disc pl-4">{r.features.map((f) => <li key={f}>{f}</li>)}</ul>} />
            <Row k="Live product" v={r.liveEvidence} />
            <Row k="Acquisition" v={<ul className="list-disc pl-4">{r.acquisitionSignals.map((f) => <li key={f}>{f}</li>)}</ul>} />
            <Row k="Pricing" v={r.pricing} />
            <Row k="Recent activity" v={<ul className="list-disc pl-4">{r.recentActivity.map((f) => <li key={f}>{f}</li>)}</ul>} />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <Row k="Tool" v={<Pill tone={r.ai.tool === "Unknown" ? "neutral" : "info"}>{r.ai.tool}</Pill>} />
            <Row k="Evidence source" v={r.ai.source} />
            <Row k="Summary" v={r.ai.summary} />
            <Row k="Confidence" v={r.ai.confidence} />
            <Row k="Last checked" v={fmtDate(r.ai.lastChecked)} />
            <p className="mt-3 text-xs text-muted-foreground">AI-building is a minor discovery signal (5 points). Absence of a signal never disqualifies a prospect.</p>
          </TabsContent>

          <TabsContent value="audit" className="mt-4 space-y-3">
            {r.opportunities.map((o) => (
              <div key={o.title} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{o.title}</p>
                  <Pill tone={o.kind === "Observed" ? "success" : "warning"}>{o.kind === "Observed" ? "Directly observed" : "Hypothesis — validate"}</Pill>
                  <Pill>{o.area}</Pill>
                </div>
                <dl className="mt-2 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-muted-foreground">Evidence</dt><dd>{o.evidence}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Why it matters</dt><dd>{o.whyItMatters}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">EpicAura intervention</dt><dd>{o.intervention}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Confidence · Commercial relevance</dt><dd>{o.confidence} · {o.commercialRelevance}</dd></div>
                </dl>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">No customer complaints, analytics, or usability-test results are assumed. Hypotheses need validation.</p>
          </TabsContent>

          <TabsContent value="buyer" className="mt-4">
            <Row k="Name" v={lead.buyer.name} />
            <Row k="Role" v={lead.buyer.role} />
            <Row k="Profile" v={<Ext href={lead.buyer.profileUrl} />} />
            <Row k="Contact page" v={<Ext href={lead.buyer.contactPage} />} />
            <Row k="Public email" v={lead.buyer.email ?? <span className="text-muted-foreground">Not found — do not guess</span>} />
            <Row k="Source" v={<Ext href={`https://${lead.domain}/about`} />} />
            <Row k="Verification" v={<Pill tone={lead.buyer.verification === "Source found" ? "info" : "neutral"}>{lead.buyer.verification}</Pill>} />
          </TabsContent>

          <TabsContent value="summary" className="mt-4 space-y-3">
            <DemoLabel>AI-style summary · mock</DemoLabel>
            {([
              ["Why it may fit EpicAura", r.summary.fit],
              ["Why now", r.summary.whyNow],
              ["Strongest evidence of design need", r.summary.strongestEvidence],
              ["Key uncertainties", r.summary.uncertainties],
              ["Recommended next action", r.summary.nextAction],
            ] as const).map(([k, v]) => (
              <div key={k}><p className="text-xs font-medium text-muted-foreground">{k}</p><p className="text-sm">{v}</p></div>
            ))}
            <div>
              <p className="text-xs font-medium text-muted-foreground">Evidence links</p>
              <ul className="mt-1 space-y-1 text-sm">{r.evidenceUrls.map((u) => <li key={u}><Ext href={u} /></li>)}</ul>
            </div>
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}
