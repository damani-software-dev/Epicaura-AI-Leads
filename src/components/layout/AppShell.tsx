import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity, Bell, ChevronsUpDown, FlaskConical, LayoutDashboard, LogOut, Menu, Plus, RotateCcw, Search,
  Settings, SlidersHorizontal, Sheet as SheetIcon, Star, Telescope, Trello, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hydrateStore, resetDemo, setState, signOut, useApp } from "@/lib/store";
import { relTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CompanyAvatar } from "@/components/shared/bits";
import { toast } from "sonner";

const NAV = [
  { section: "Workspace", items: [
    { to: "/overview", label: "Overview", icon: LayoutDashboard },
    { to: "/discover", label: "Discover Leads", icon: Telescope },
    { to: "/research", label: "Lead Research", icon: FlaskConical },
    { to: "/qualified", label: "Qualified Leads", icon: Star },
    { to: "/pipeline", label: "Pipeline", icon: Trello },
  ] },
  { section: "Management", items: [
    { to: "/sheets", label: "Google Sheets", icon: SheetIcon },
    { to: "/activity", label: "Activity Log", icon: Activity },
  ] },
  { section: "Configuration", items: [
    { to: "/icp", label: "ICP & Scoring", icon: SlidersHorizontal },
    { to: "/settings", label: "Settings", icon: Settings },
  ] },
] as const;

const TITLES: Record<string, string> = Object.fromEntries(NAV.flatMap((s) => s.items.map((i) => [i.to, i.label])));

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const ws = useApp((s) => s.settings.workspaceName);
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-[11px] font-bold tracking-tight text-background">EA</span>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">EpicAura Studio</p>
          <p className="text-[11px] text-muted-foreground">Lead Agent</p>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        {NAV.map((s) => (
          <div key={s.section}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">{s.section}</p>
            {s.items.map((i) => {
              const active = path === i.to || path.startsWith(`${i.to}/`) || (i.to === "/qualified" && path.startsWith("/leads"));
              return (
                <Link
                  key={i.to}
                  to={i.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                    active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <i.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
                  {i.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent">
            <CompanyAvatar name={ws} size="sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{ws}</p>
              <p className="text-[11px] text-muted-foreground">Demo workspace</p>
            </div>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Demo workspace</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => { navigate({ to: "/settings" }); onNavigate?.(); }}><User /> Workspace profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigate({ to: "/icp" }); onNavigate?.(); }}><SlidersHorizontal /> ICP & Scoring</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { resetDemo(); toast.success("Demo data reset"); }}><RotateCcw /> Reset demo data</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { signOut(); onNavigate?.(); }}><LogOut /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const leads = useApp((s) => s.leads);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return leads.filter((l) => [l.company, l.buyer.name, l.domain, l.category].some((x) => x.toLowerCase().includes(t))).slice(0, 7);
  }, [q, leads]);
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { navigate({ to: "/leads/$id", params: { id: results[0].id } }); setQ(""); } }}
        placeholder="Search companies and contacts…"
        aria-label="Global search"
        className="h-8 w-full rounded-md border bg-muted/50 pl-8 pr-12 text-sm outline-none placeholder:text-muted-foreground focus:border-ring focus:bg-card"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border bg-card px-1 text-[10px] text-muted-foreground sm:block">⌘K</kbd>
      {open && q && (
        <div className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-lg border bg-popover shadow-pop">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No companies or contacts match “{q}”.</p>
          ) : results.map((l) => (
            <button
              key={l.id}
              onMouseDown={() => { navigate({ to: "/leads/$id", params: { id: l.id } }); setQ(""); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent"
            >
              <CompanyAvatar name={l.company} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{l.company}</p>
                <p className="truncate text-xs text-muted-foreground">{l.buyer.name} · {l.buyer.role} · {l.market}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const items = useApp((s) => s.notifications);
  const navigate = useNavigate();
  const unread = items.filter((n) => !n.read).length;
  const markAll = () => setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>}
          {items.slice(0, 8).map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => {
                setState((s) => ({ ...s, notifications: s.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }));
                if (n.to) navigate({ to: n.to });
              }}
              className="flex items-start gap-2 rounded-none px-3 py-2.5"
            >
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0">
                <p className="text-sm leading-snug">{n.text}</p>
                <p className="text-xs text-muted-foreground">{relTime(n.at)}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { hydrateStore(); }, []);
  const title = path.startsWith("/leads") ? "Lead Profile" : TITLES[path] ?? "EpicAura";
  const crumb = path.startsWith("/leads") ? "Qualified Leads" : NAV.find((s) => s.items.some((i) => i.to === path))?.section;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav onNavigate={() => setMobile(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur lg:px-6">
          <Button variant="ghost" size="icon" className="size-8 lg:hidden" onClick={() => setMobile(true)} aria-label="Open navigation">
            <Menu className="size-4" />
          </Button>
          <div className="hidden min-w-0 md:block">
            <p className="text-[11px] text-muted-foreground">{crumb}</p>
            <p className="-mt-0.5 truncate text-sm font-semibold">{title}</p>
          </div>
          <div className="flex flex-1 justify-center md:ml-6 md:justify-start"><GlobalSearch /></div>
          <span className="hidden items-center gap-1.5 rounded-md border border-warning/30 bg-warning-soft px-2 py-1 text-[11px] font-medium text-warning sm:inline-flex">
            <span className="size-1.5 rounded-full bg-warning" /> Demo Mode
          </span>
          <Notifications />
          <Button asChild size="sm" className="h-8">
            <Link to="/discover" search={{ new: true }}><Plus className="size-4" /><span className="hidden sm:inline">New Discovery</span></Link>
          </Button>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
