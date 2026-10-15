import type { Activity, ColumnMapping, DiscoverySession, Spreadsheet, SyncRun } from "@/types";

const at = (daysAgo: number, h: number) => {
  const t = new Date("2026-10-14T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - daysAgo);
  t.setUTCHours(h, (h * 7) % 60);
  return t.toISOString();
};

export const seedActivities: Activity[] = [
  { id: "A-1", at: at(0, 15), type: "Status", title: "Moved to Proposal", subject: "Pipewise", leadId: "L-1007", outcome: "Success", details: "Stage changed from Discovery Call to Proposal by Damani B." },
  { id: "A-2", at: at(0, 13), type: "Research", title: "Research started", subject: "Payrella", leadId: "L-1011", outcome: "Info", details: "Simulated research run queued for buyer and product analysis." },
  { id: "A-3", at: at(1, 16), type: "Status", title: "Moved to Outreach Ready", subject: "Ledgerloop", leadId: "L-1001", outcome: "Success", details: "Outreach draft approved; awaiting send." },
  { id: "A-4", at: at(1, 14), type: "Sheets preview", title: "Sync preview completed", subject: "EpicAura Leads 2026", outcome: "Info", details: "Demo preview: 6 new, 3 updates, 1 skipped (missing website)." },
  { id: "A-5", at: at(1, 11), type: "Qualification", title: "Score updated 76 → 82", subject: "Crewclock", leadId: "L-1020", outcome: "Success", details: "Design-need evidence raised after help-center review." },
  { id: "A-6", at: at(1, 10), type: "Research", title: "Research flagged for review", subject: "Fleetbook", leadId: "L-1010", outcome: "Warning", details: "Team size and buyer role could not be confirmed." },
  { id: "A-7", at: at(2, 17), type: "Outreach", title: "LinkedIn DM drafted", subject: "Shiftwell", leadId: "L-1002", outcome: "Success", details: "Draft referenced the shift-swap flow observation." },
  { id: "A-8", at: at(2, 12), type: "Qualification", title: "Marked as qualified", subject: "Clinicnest", leadId: "L-1004", outcome: "Success", details: "Score 82, High Priority." },
  { id: "A-9", at: at(2, 9), type: "Discovery", title: "Discovery session run", subject: "Jamaica founder-led SaaS", outcome: "Success", details: "8 prospects matched filters; 4 added to research queue." },
  { id: "A-10", at: at(3, 15), type: "Status", title: "Replied", subject: "Cargomint", leadId: "L-1003", outcome: "Success", details: "Priya replied asking for availability next week." },
  { id: "A-11", at: at(4, 11), type: "Research", title: "Research completed", subject: "Tallyroom", leadId: "L-1005", outcome: "Success", details: "2 opportunities identified (1 observed, 1 hypothesis)." },
  { id: "A-12", at: at(5, 14), type: "Configuration", title: "Qualification threshold changed", subject: "ICP & Scoring", outcome: "Info", details: "Qualified threshold kept at 65; High Priority at 80." },
  { id: "A-13", at: at(6, 10), type: "Status", title: "Won", subject: "Rentroll", leadId: "L-1008", outcome: "Success", details: "Estimated retainer US$4,500/mo (estimate, not invoiced)." },
  { id: "A-14", at: at(7, 16), type: "Qualification", title: "Prospect rejected", subject: "Glowcart", leadId: "L-1018", outcome: "Warning", details: "Excluded: B2C-only business." },
  { id: "A-15", at: at(8, 13), type: "Sheets sync", title: "Demo sync completed", subject: "EpicAura Leads 2026", outcome: "Success", details: "Demo Sync: 7 records processed (5 new, 2 updated)." },
  { id: "A-16", at: at(9, 15), type: "Status", title: "Lost", subject: "Docketly", leadId: "L-1009", outcome: "Failed", details: "Founder paused product investment until Q1." },
  { id: "A-17", at: at(10, 9), type: "Discovery", title: "Discovery session run", subject: "US HRTech & Ops", outcome: "Success", details: "11 prospects matched filters." },
  { id: "A-18", at: at(12, 10), type: "Prospect", title: "Prospect added", subject: "Formcraft", leadId: "L-1022", outcome: "Info", details: "Added manually for comparison." },
];

const baseFilters = {
  stages: [], sizes: [], categories: [], aiSignals: [], roles: [], areas: [], minScore: 0, max: 25,
};

export const seedSessions: DiscoverySession[] = [
  { id: "S-1", name: "Jamaica founder-led SaaS", at: at(2, 9), filters: { ...baseFilters, name: "Jamaica founder-led SaaS", markets: ["Jamaica"] }, resultIds: ["L-1001", "L-1004", "L-1008", "L-1012", "L-1016", "L-1021"], researched: 4, qualified: 3 },
  { id: "S-2", name: "US HRTech & Ops", at: at(10, 9), filters: { ...baseFilters, name: "US HRTech & Ops", markets: ["United States"], categories: ["HRTech", "Operations"] }, resultIds: ["L-1002", "L-1005", "L-1015", "L-1020"], researched: 3, qualified: 3 },
  { id: "S-3", name: "Caribbean early traction", at: at(18, 11), filters: { ...baseFilters, name: "Caribbean early traction", markets: ["Wider Caribbean"], stages: ["Early Traction"] }, resultIds: ["L-1006", "L-1010", "L-1014", "L-1019"], researched: 2, qualified: 1 },
];

export const seedSpreadsheets: Spreadsheet[] = [
  { id: "SS-1", name: "EpicAura Leads 2026", worksheets: [{ id: "W-1", name: "Qualified Leads", rows: 14 }, { id: "W-2", name: "Pipeline", rows: 8 }] },
  { id: "SS-2", name: "Prospect Research Archive", worksheets: [{ id: "W-3", name: "All Prospects", rows: 42 }, { id: "W-4", name: "Rejected", rows: 6 }] },
];

const cols: [string, string, boolean, boolean?][] = [
  ["id", "Lead ID", true, true], ["company", "Company Name", true, true], ["website", "Website", true],
  ["country", "Country", true], ["market", "Market", true], ["category", "Product Category", true],
  ["stage", "Company Stage", false], ["teamSize", "Team Size", false], ["aiSignal", "AI-Building Signal", true],
  ["buyer", "Primary Buyer", true], ["role", "Buyer Role", true], ["email", "Public Contact Email", false],
  ["profile", "Professional Profile URL", false], ["icpScore", "ICP Fit Score", false], ["designScore", "Design Need Score", false],
  ["commercialScore", "Commercial Readiness Score", false], ["score", "Overall Qualification Score", true],
  ["tier", "Qualification Tier", true], ["opportunity", "Main Design Opportunity", true], ["summary", "Research Summary", false],
  ["evidence", "Evidence URLs", false], ["researchStatus", "Research Status", true], ["status", "Outreach Status", true],
  ["nextAction", "Next Action", true], ["lastResearched", "Last Researched", false], ["updated", "Last Updated", true],
];
export const seedMappings: ColumnMapping[] = cols.map(([key, label, enabled, required]) => ({ key, label, enabled, required }));

export const seedSyncRuns: SyncRun[] = [
  { id: "R-1", at: at(8, 13), spreadsheet: "EpicAura Leads 2026", worksheet: "Qualified Leads", processed: 7, created: 5, updated: 2, skipped: 0, outcome: "Success", details: "Demo Sync — append + update by Lead ID." },
  { id: "R-2", at: at(15, 10), spreadsheet: "Prospect Research Archive", worksheet: "All Prospects", processed: 12, created: 12, updated: 0, skipped: 1, outcome: "Success", details: "Demo Sync — 1 record skipped (missing website)." },
];
