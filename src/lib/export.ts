import { downloadFile, toCsv } from "@/lib/format";
import { getState, log, scoreOf, tierOf } from "@/lib/store";
import type { Lead } from "@/types";

export function leadRow(l: Lead) {
  return {
    "Lead ID": l.id, Company: l.company, Website: `https://${l.domain}`, Market: l.market, Country: l.country,
    Category: l.category, Stage: l.stage, "Team Size": l.teamSize, "AI Signal": l.aiSignal,
    Buyer: l.buyer.name, Role: l.buyer.role, Score: scoreOf(l), Tier: tierOf(l),
    "Design Opportunity": l.designGap, "Research Status": l.researchStatus, Status: l.status, "Next Action": l.nextAction,
  };
}

export function exportLeads(leads: Lead[], label = "leads") {
  const fmt = getState().settings.exportFormat;
  const rows = leads.map(leadRow);
  if (fmt === "JSON") downloadFile(`epicaura-${label}.json`, JSON.stringify(rows, null, 2), "application/json");
  else downloadFile(`epicaura-${label}.csv`, toCsv(rows));
  log({ type: "Prospect", title: `Exported ${leads.length} records (${fmt})`, subject: label, outcome: "Success", details: "Local file download from demo data." });
}
