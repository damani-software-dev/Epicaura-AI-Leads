import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ScrollText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChipSelect, EmptyState, PageHeader, Pill } from "@/components/shared/bits";
import { useApp } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import type { Activity, ActivityType } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity Log — EpicAura Lead Agent" },
      { name: "description", content: "Searchable history of discovery, research, qualification, and sync events." },
      { property: "og:title", content: "Activity Log — EpicAura Lead Agent" },
      { property: "og:description", content: "Searchable history of discovery, research, qualification, and sync events." },
    ],
  }),
  component: ActivityLog,
});

const TYPES: ActivityType[] = ["Discovery", "Prospect", "Research", "Qualification", "Status", "Outreach", "Sheets preview", "Sheets sync", "Configuration"];
const OUTCOMES: Activity["outcome"][] = ["Success", "Info", "Warning", "Failed"];
const tone = (o: Activity["outcome"]) => (o === "Success" ? "success" : o === "Warning" ? "warning" : o === "Failed" ? "danger" : "neutral") as "success" | "warning" | "danger" | "neutral";

function ActivityLog() {
  const acts = useApp((s) => s.activities);
  const [q, setQ] = useState("");
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [outcomes, setOutcomes] = useState<Activity["outcome"][]>([]);
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState<string[]>([]);

  const list = useMemo(() => {
    const t = q.toLowerCase();
    const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
    return acts.filter((a) => (!t || a.subject.toLowerCase().includes(t) || a.title.toLowerCase().includes(t)) && (!types.length || types.includes(a.type)) && (!outcomes.length || outcomes.includes(a.outcome)) && new Date(a.at).getTime() >= cutoff);
  }, [acts, q, types, outcomes, range]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Activity Log" description="Every discovery, research run, status change, and demo sync in this workspace." />
      <div className="mb-3 space-y-3 rounded-lg border bg-card p-3 shadow-card">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:max-w-xs"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or session…" className="h-8 pl-8" /></div>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="h-8 w-36" aria-label="Date range"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="1">Last 24 hours</SelectItem><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="all">All time</SelectItem></SelectContent>
          </Select>
        </div>
        <ChipSelect options={TYPES} value={types} onChange={setTypes} />
        <ChipSelect options={OUTCOMES} value={outcomes} onChange={setOutcomes} />
      </div>
      <section className="divide-y rounded-lg border bg-card shadow-card">
        {list.length === 0 && <EmptyState icon={<ScrollText className="size-5" />} title="No activity matches" />}
        {list.map((a) => {
          const isOpen = open.includes(a.id);
          return (
            <div key={a.id}>
              <button onClick={() => setOpen(isOpen ? open.filter((x) => x !== a.id) : [...open, a.id])} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/40" aria-expanded={isOpen}>
                <span className="tabular w-28 shrink-0 text-xs text-muted-foreground">{fmtDateTime(a.at)}</span>
                <Pill className="hidden w-24 justify-center sm:inline-flex">{a.type}</Pill>
                <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{a.title}</span> <span className="text-muted-foreground">· {a.subject}</span></span>
                <Pill tone={tone(a.outcome)}>{a.outcome}</Pill>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </button>
              {isOpen && (
                <div className="bg-muted/30 px-4 py-3 text-sm sm:pl-[10.5rem]">
                  <p>{a.details}</p>
                  {a.leadId && <Link to="/leads/$id" params={{ id: a.leadId }} className="mt-1 inline-block text-xs text-primary hover:underline">Open {a.subject}</Link>}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
