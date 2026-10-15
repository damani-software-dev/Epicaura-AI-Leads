import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight, Briefcase, FlaskConical, Send, Sheet as SheetIcon, Star, Target, Telescope, Zap,
} from "lucide-react";
import { Panel, PageHeader, CompanyAvatar, ScoreBadge, StatusBadge, Pill } from "@/components/shared/bits";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { overallScore, tierFor } from "@/lib/scoring";
import { useApp } from "@/lib/store";
import { relTime } from "@/lib/format";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Overview — EpicAura Lead Agent" },
      { name: "description", content: "Lead-generation performance, pipeline, and priority prospects for EpicAura Studio." },
      { property: "og:title", content: "Overview — EpicAura Lead Agent" },
      { property: "og:description", content: "Lead-generation performance, pipeline, and priority prospects for EpicAura Studio." },
    ],
  }),
  component: Overview,
});

const series = Array.from({ length: 30 }, (_, i) => {
  const date = new Date("2026-10-14T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - (29 - i));
  const discovered = 2 + ((i * 7) % 5) + Math.floor(i / 6);
  return { date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), discovered, qualified: Math.max(0, Math.round(discovered * 0.35 + ((i * 3) % 3) - 1)) };
});

function Overview() {
  const leads = useApp((s) => s.leads);
  const weights = useApp((s) => s.weights);
  const thresholds = useApp((s) => s.thresholds);
  const activities = useApp((s) => s.activities);
  const [range, setRange] = useState("30");
  const navigate = useNavigate();

  const scored = useMemo(() => leads.map((l) => { const score = overallScore(l.scores, weights); return { l, score, tier: tierFor(score, thresholds) }; }), [leads, weights, thresholds]);
  const count = (f: (l: (typeof scored)[number]) => boolean) => scored.filter(f).length;

  const kpis = [
    { label: "Prospects Discovered", v: leads.length, d: "Across all discovery sessions", icon: Telescope, to: "/discover" },
    { label: "Researched", v: count(({ l }) => l.researchStatus === "Completed"), d: `${count(({ l }) => ["Queued", "In progress", "Needs review"].includes(l.researchStatus))} in queue`, icon: FlaskConical, to: "/research" },
    { label: "Qualified Leads", v: count(({ l }) => l.qualified), d: `Score ≥ ${thresholds.qualified}`, icon: Star, to: "/qualified" },
    { label: "High-Priority Leads", v: count(({ l, tier }) => l.qualified && tier === "High Priority"), d: `Score ≥ ${thresholds.high}`, icon: Target, to: "/qualified" },
    { label: "Outreach Ready", v: count(({ l }) => l.status === "Outreach Ready"), d: "Drafts prepared, not sent", icon: Send, to: "/pipeline" },
    { label: "Active Opportunities", v: count(({ l }) => ["Replied", "Discovery Call", "Proposal"].includes(l.status)), d: "Replied, call, or proposal", icon: Briefcase, to: "/pipeline" },
  ] as const;

  const funnel: [string, number][] = [
    ["Discovered", leads.length],
    ["Researching", count(({ l }) => l.researchStatus !== "Not started")],
    ["Qualified", count(({ l }) => l.qualified)],
    ["Outreach Ready", count(({ l }) => ["Outreach Ready", "Contacted", "Replied", "Discovery Call", "Proposal", "Won", "Lost"].includes(l.status))],
    ["Contacted", count(({ l }) => ["Contacted", "Replied", "Discovery Call", "Proposal", "Won", "Lost"].includes(l.status))],
    ["Replied", count(({ l }) => ["Replied", "Discovery Call", "Proposal", "Won"].includes(l.status))],
    ["Opportunity", count(({ l }) => ["Discovery Call", "Proposal", "Won"].includes(l.status))],
    ["Won", count(({ l }) => l.status === "Won")],
    ["Lost", count(({ l }) => l.status === "Lost")],
  ];
  const max = funnel[0][1] || 1;
  const top = scored.filter(({ l }) => l.status !== "Rejected" && l.status !== "Won" && l.status !== "Lost").sort((a, b) => b.score - a.score).slice(0, 5);
  const data = series.slice(-Number(range));

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Overview" description="Discovery-to-opportunity performance for founder-led B2B SaaS prospects." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="group rounded-lg border bg-card p-4 shadow-card transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{k.label}</span>
              <k.icon className="size-4 group-hover:text-primary" />
            </div>
            <p className="tabular mt-2 text-2xl font-semibold tracking-tight">{k.v}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{k.d}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Lead generation activity"
          action={
            <ToggleGroup type="single" size="sm" value={range} onValueChange={(v) => v && setRange(v)} variant="outline">
              <ToggleGroupItem value="7" className="h-7 px-2 text-xs">7d</ToggleGroupItem>
              <ToggleGroupItem value="14" className="h-7 px-2 text-xs">14d</ToggleGroupItem>
              <ToggleGroupItem value="30" className="h-7 px-2 text-xs">30d</ToggleGroupItem>
            </ToggleGroup>
          }
        >
          <div className="mb-2 flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" />Discovered ({data.reduce((a, b) => a + b.discovered, 0)})</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" />Qualified ({data.reduce((a, b) => a + b.qualified, 0)})</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: -24, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="q" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
                <Area type="monotone" dataKey="discovered" stroke="var(--chart-2)" strokeWidth={1.5} fill="transparent" name="Discovered" />
                <Area type="monotone" dataKey="qualified" stroke="var(--chart-1)" strokeWidth={2} fill="url(#q)" name="Qualified" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Lead pipeline" action={<Link to="/pipeline" className="text-xs text-primary hover:underline">Open pipeline</Link>}>
          <div className="space-y-2">
            {funnel.map(([k, v]) => (
              <button key={k} onClick={() => navigate({ to: k === "Discovered" || k === "Researching" ? "/research" : "/pipeline" })} className="group block w-full text-left">
                <div className="flex justify-between text-xs"><span className="group-hover:text-primary">{k}</span><span className="tabular text-muted-foreground">{v}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={k === "Lost" ? "h-full rounded-full bg-destructive/50" : "h-full rounded-full bg-primary"} style={{ width: `${(v / max) * 100}%` }} />
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Priority leads" bodyClass="p-0" action={<Link to="/qualified" className="text-xs text-primary hover:underline">View all</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">Company</th><th className="px-2 py-2 font-medium">Market</th><th className="px-2 py-2 font-medium">Score</th><th className="hidden px-2 py-2 font-medium md:table-cell">Design opportunity</th><th className="px-4 py-2 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {top.map(({ l, score, tier }) => (
                  <tr key={l.id} onClick={() => navigate({ to: "/leads/$id", params: { id: l.id } })} className="cursor-pointer border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-2.5"><span className="flex items-center gap-2"><CompanyAvatar name={l.company} size="sm" /><span className="font-medium">{l.company}</span></span></td>
                    <td className="px-2 py-2.5 text-muted-foreground">{l.market}</td>
                    <td className="px-2 py-2.5"><ScoreBadge score={score} tier={tier} /></td>
                    <td className="hidden px-2 py-2.5 md:table-cell"><Pill>{l.designArea}</Pill></td>
                    <td className="px-4 py-2.5"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Quick actions" bodyClass="p-2">
            {([
              ["Start New Discovery", "/discover", Zap],
              ["Review Research Queue", "/research", FlaskConical],
              ["View Qualified Leads", "/qualified", Star],
              ["Preview Google Sheets Export", "/sheets", SheetIcon],
            ] as const).map(([label, to, Icon]) => (
              <Link key={label} to={to} className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-accent">
                <Icon className="size-4 text-primary" /><span className="flex-1">{label}</span><ArrowRight className="size-3.5 text-muted-foreground" />
              </Link>
            ))}
          </Panel>
          <Panel title="Recent activity" action={<Link to="/activity" className="text-xs text-primary hover:underline">All</Link>}>
            <ul className="space-y-3">
              {activities.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <p className="leading-snug">{a.title} <span className="text-muted-foreground">· {a.subject}</span></p>
                    <p className="text-xs text-muted-foreground">{relTime(a.at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
