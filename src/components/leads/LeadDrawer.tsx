import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CompanyAvatar, StatusBadge } from "@/components/shared/bits";
import { ScoreBreakdown } from "@/components/leads/ScoreBreakdown";
import { useApp } from "@/lib/store";
import { fmtMoney, relTime } from "@/lib/format";

export function LeadDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const lead = useApp((s) => s.leads.find((l) => l.id === id));
  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {lead && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <CompanyAvatar name={lead.company} size="lg" />
                <div>
                  <SheetTitle>{lead.company}</SheetTitle>
                  <SheetDescription>{lead.domain} · {lead.market}</SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-6">
              <p className="text-sm text-muted-foreground">{lead.description}</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted-foreground">Buyer</dt><dd>{lead.buyer.name}<br /><span className="text-xs text-muted-foreground">{lead.buyer.role}</span></dd></div>
                <div><dt className="text-xs text-muted-foreground">Status</dt><dd><StatusBadge status={lead.status} /></dd></div>
                <div><dt className="text-xs text-muted-foreground">Design opportunity</dt><dd>{lead.designArea}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Est. retainer</dt><dd>{fmtMoney(lead.estRetainer)}<span className="text-xs text-muted-foreground">/mo est.</span></dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Next action</dt><dd>{lead.nextAction} <span className="text-xs text-muted-foreground">· {relTime(lead.lastActivity)}</span></dd></div>
              </dl>
              <ScoreBreakdown lead={lead} compact />
              <Button asChild className="w-full">
                <Link to="/leads/$id" params={{ id: lead.id }}>Open full profile <ArrowUpRight /></Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
