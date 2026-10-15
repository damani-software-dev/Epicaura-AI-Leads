import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LeadStatus, ResearchStatus, Tier } from "@/types";
import { Check } from "lucide-react";

type Tone = "success" | "warning" | "danger" | "info" | "neutral";
const toneCls: Record<Tone, string> = {
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-destructive-soft text-destructive border-destructive/20",
  info: "bg-info-soft text-info border-info/20",
  neutral: "bg-neutral-soft text-muted-foreground border-border",
};

export function Pill({ tone = "neutral", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-4", toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const tierTone = (t: Tier): Tone =>
  t === "High Priority" ? "success" : t === "Qualified" ? "info" : t === "Needs Review" ? "warning" : "neutral";

export function TierBadge({ tier }: { tier: Tier }) {
  return <Pill tone={tierTone(tier)} dot>{tier}</Pill>;
}

export function ScoreBadge({ score, tier }: { score: number; tier: Tier }) {
  const tone = tierTone(tier);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular w-6 text-right text-sm font-semibold">{score}</span>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full rounded-full", tone === "success" ? "bg-success" : tone === "info" ? "bg-info" : tone === "warning" ? "bg-warning" : "bg-muted-foreground/50")}
          style={{ width: `${score}%` }}
        />
      </span>
    </span>
  );
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const tone: Tone =
    status === "Won" || status === "Replied" || status === "Outreach Ready" ? "success"
      : status === "Lost" || status === "Rejected" ? "danger"
      : status === "Researching" || status === "Discovered" ? "neutral"
      : status === "Proposal" || status === "Discovery Call" ? "warning" : "info";
  return <Pill tone={tone}>{status}</Pill>;
}

export function ResearchBadge({ status }: { status: ResearchStatus }) {
  const tone: Tone = status === "Completed" ? "success" : status === "Needs review" ? "warning" : status === "In progress" ? "info" : "neutral";
  return <Pill tone={tone} dot>{status}</Pill>;
}

export function CompanyAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-md border bg-primary-soft font-semibold text-primary",
      size === "sm" ? "size-6 text-[10px]" : size === "lg" ? "size-12 text-base" : "size-8 text-xs",
    )}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, bodyClass }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card shadow-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted text-muted-foreground">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ChipSelect<T extends string>({ options, value, onChange, single }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void; single?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(single ? [o] : on ? value.filter((x) => x !== o) : [...value, o])}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
              on ? "border-primary/40 bg-primary-soft text-primary" : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {on && <Check className="size-3" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function DemoLabel({ children = "Prototype · mock data" }: { children?: ReactNode }) {
  return <Pill tone="warning">{children}</Pill>;
}
