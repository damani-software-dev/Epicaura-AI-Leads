import type { DesignOpportunity, Lead, Research } from "@/types";

type Detail = {
  features: string[]; acquisition: string[]; pricing: string; recent: string[];
  aiSource: string; aiSummary: string; aiConf: "High" | "Medium" | "Low";
  observed: [string, string, string]; hypothesis: [string, string, string];
  whyNow: string; uncertainty: string;
};

const details: Record<string, Detail> = {
  "L-1001": {
    features: ["Multi-currency invoicing (JMD, TTD, USD)", "Bank reconciliation import", "Client payment portal"],
    acquisition: ["Free 14-day trial CTA on homepage", "Founder posts weekly customer stories on LinkedIn"],
    pricing: "Public pricing page: Starter, Growth, Pro tiers",
    recent: ["Launched TTD support (Sept 2026)", "Hiring a full-stack engineer"],
    aiSource: "Founder LinkedIn post", aiSummary: "Founder publicly described rebuilding the client portal with Lovable.", aiConf: "High",
    observed: ["Business verification is a 6-step form with no progress indicator", "Onboarding", "Signup flow walkthrough on public demo video"],
    hypothesis: ["Reconciliation screen may overwhelm non-accountant users", "Workflow UX", "Dense table seen in product screenshots"],
    whyNow: "Expanding into Trinidad while hiring engineering, not design.", uncertainty: "Budget for a retainer not yet evidenced.",
  },
  "L-1002": {
    features: ["Drag-to-schedule calendar", "Shift swap requests", "Multi-location availability"],
    acquisition: ["Product Hunt launch (Aug 2026)", "Comparison pages vs. larger competitors"],
    pricing: "Per-location monthly pricing published",
    recent: ["Added payroll export", "Two engineering roles open"],
    aiSource: "Engineering blog", aiSummary: "Team blog mentions Cursor as the primary editor for the new mobile app.", aiConf: "Medium",
    observed: ["Shift swap requires 5 screens and manager re-entry of details", "Workflow UX", "Public help-center screenshots"],
    hypothesis: ["Manager dashboard may not scale past 10 locations", "Product Strategy", "Feature growth outpacing navigation"],
    whyNow: "Post-launch growth with new features shipping monthly.", uncertainty: "Unclear whether a contract designer is already involved.",
  },
  "L-1003": {
    features: ["Instant freight quotes", "Shipment tracking", "Customs document checklist"],
    acquisition: ["Paid search ads for 'ship to Jamaica'", "Webinars for importers"],
    pricing: "Quote-based; no public pricing", recent: ["Opened Kingston partner office", "Seed round announced (June 2026)"],
    aiSource: "None found", aiSummary: "No public indicators of AI-building tools. Not a disqualifier.", aiConf: "Low",
    observed: ["Shipment exceptions only appear as a status column in a dense table", "Feature Design", "Public product tour"],
    hypothesis: ["Customs checklist may cause repeat support tickets", "Usability", "Checklist length on docs page"],
    whyNow: "Fresh seed funding and regional expansion.", uncertainty: "Engineering-led roadmap; design ownership unknown.",
  },
  "L-1004": {
    features: ["Online booking", "SMS reminders", "Patient intake forms"],
    acquisition: ["Facebook ads targeting clinics", "Free setup offer"], pricing: "Single monthly plan, public",
    recent: ["Launched intake forms (Sept 2026)"],
    aiSource: "Public 'Built with Bolt' footer badge", aiSummary: "Marketing site footer shows a Bolt badge.", aiConf: "High",
    observed: ["Primary buttons differ in color and size across booking steps", "UX Consistency", "Booking page review"],
    hypothesis: ["Mobile booking may lose patients at the time-slot step", "Usability", "Slot grid overflows on narrow screens"],
    whyNow: "New features shipping quickly with a 3-person team.", uncertainty: "Small team; retainer size may need to be modest.",
  },
  "L-1005": {
    features: ["Cycle counts", "Barcode scanning", "Audit trail exports"], acquisition: ["Cold outreach to distributors", "Founder podcast appearances"],
    pricing: "Pricing on request", recent: ["Added barcode scanning"],
    aiSource: "Replit community showcase", aiSummary: "Project listed in a Replit showcase thread by the founder.", aiConf: "Medium",
    observed: ["Settings, reports, and audits share one crowded menu", "Product Strategy", "Logged-out navigation"],
    hypothesis: ["Information architecture may limit adoption of new modules", "Product Strategy", "Feature list growth"],
    whyNow: "Feature set expanding beyond the original count tool.", uncertainty: "Pricing unknown; commercial readiness lower confidence.",
  },
  "L-1006": {
    features: ["Course builder", "Grading rubrics", "Attendance tracking"], acquisition: ["Partnership with a regional training council"],
    pricing: "Per-learner pricing published", recent: ["Signed two new institutes"],
    aiSource: "CTO conference talk", aiSummary: "CTO mentioned using Claude for code review in a recorded talk.", aiConf: "Medium",
    observed: ["Teacher and admin dashboards use different table and filter patterns", "UX Consistency", "Demo video"],
    hypothesis: ["Learners may struggle to find grades on mobile", "Usability", "Not directly observed"],
    whyNow: "New institutional customers increase pressure on consistency.", uncertainty: "Procurement may be slow for education buyers.",
  },
  "L-1007": {
    features: ["Multi-touch attribution", "CRM sync", "Pipeline dashboards"], acquisition: ["Content marketing", "Partner program with CRM vendors"],
    pricing: "Tiered public pricing", recent: ["Series A announced (Sept 2026)", "Hiring PM"],
    aiSource: "Job post", aiSummary: "Engineering job post lists 'Cursor experience a plus'.", aiConf: "Medium",
    observed: ["First-run experience opens directly into CRM integration setup", "Onboarding", "Free trial signup"],
    hypothesis: ["Dashboards may be too dense for marketing generalists", "Workflow UX", "Screenshots only"],
    whyNow: "Series A and PM hire suggest product investment phase.", uncertainty: "May hire in-house designer after funding.",
  },
  "L-1008": {
    features: ["Tenant ledger", "Rent reminders", "Maintenance requests"], acquisition: ["Landlord WhatsApp groups", "Referral discount"],
    pricing: "Per-unit pricing public", recent: ["Added maintenance requests"],
    aiSource: "Founder X post", aiSummary: "Founder shared Lovable screenshots of the ledger build.", aiConf: "High",
    observed: ["Ledger view lacks empty states and summary totals", "Usability", "Demo account"],
    hypothesis: ["Landlords may miss overdue rent without clearer alerts", "Feature Design", "Not directly observed"],
    whyNow: "Signed retainer — kept for reference.", uncertainty: "None outstanding.",
  },
  "L-1009": {
    features: ["Matter intake", "Deadline calendar", "Document templates"], acquisition: ["Bar association sponsorship"],
    pricing: "Per-seat public pricing", recent: ["No releases in 3 months"],
    aiSource: "None found", aiSummary: "No public AI-building evidence.", aiConf: "Low",
    observed: ["Intake form is a single long page with 40+ fields", "Workflow UX", "Public intake demo"],
    hypothesis: ["Attorneys may abandon intake on mobile", "Usability", "Not directly observed"],
    whyNow: "Was evaluating options before going quiet.", uncertainty: "Development activity has slowed.",
  },
  "L-1020": {
    features: ["Crew time tracking", "GPS clock-in", "Approval queue"], acquisition: ["Trade-show presence", "Google Ads"],
    pricing: "Per-crew public pricing", recent: ["Launched Spanish UI", "Integration with QuickBooks"],
    aiSource: "Engineering podcast", aiSummary: "Head of Product said Claude helps draft specs and prototypes.", aiConf: "Medium",
    observed: ["Approving a crew's week requires opening each timesheet individually", "Workflow UX", "Help-center video"],
    hypothesis: ["Bulk approval could reduce manager time significantly", "Feature Design", "Hypothesis — needs validation"],
    whyNow: "Bilingual launch broadens the market; workflows under strain.", uncertainty: "Retainer budget not yet discussed.",
  },
};

const opp = (lead: Lead, t: [string, string, string], kind: "Observed" | "Hypothesis"): DesignOpportunity => ({
  title: t[0],
  area: t[1] as DesignOpportunity["area"],
  evidence: t[2],
  whyItMatters: kind === "Observed"
    ? `Friction here sits on a core path for ${lead.audience.toLowerCase()}.`
    : "If confirmed, this would affect activation and retention.",
  intervention: kind === "Observed"
    ? `Redesign the ${t[1].toLowerCase()} flow with clear steps, states, and a reusable pattern.`
    : "Run a short heuristic review and 3–5 user conversations to validate.",
  confidence: kind === "Observed" ? "High" : "Low",
  kind,
  commercialRelevance: kind === "Observed" ? "High" : "Medium",
});

export function buildResearch(lead: Lead, variant = 0): Research {
  const det = details[lead.id];
  const generic: Detail = {
    features: [`Core ${lead.category} workflow`, "Team accounts", "Reporting"],
    acquisition: ["Public signup or demo request form"],
    pricing: variant % 2 ? "Public pricing page found" : "No public pricing found",
    recent: ["Product changelog shows recent updates"],
    aiSource: lead.aiSignal === "Unknown" ? "None found" : "Public mention (mock)",
    aiSummary: lead.aiSignal === "Unknown" ? "No visible AI-building signal. Not a disqualifier." : `Possible use of ${lead.aiSignal} based on public mentions.`,
    aiConf: lead.aiSignal === "Unknown" ? "Low" : "Medium",
    observed: [lead.designGap, lead.designArea, "Public marketing site and product screenshots"],
    hypothesis: ["Navigation may become harder as features grow", "Product Strategy", "Inferred from feature list"],
    whyNow: `${lead.stage} with visible product activity.`,
    uncertainty: "Team composition and design capacity not confirmed.",
  };
  const x = det ?? generic;
  return {
    whatItDoes: lead.description,
    serves: lead.audience,
    features: x.features,
    liveEvidence: `Live signup at https://${lead.domain}/signup`,
    acquisitionSignals: x.acquisition,
    pricing: x.pricing,
    recentActivity: x.recent,
    ai: { tool: lead.aiSignal, source: x.aiSource, summary: x.aiSummary, confidence: x.aiConf, lastChecked: lead.lastResearched ?? new Date().toISOString() },
    opportunities: [opp(lead, x.observed, "Observed"), opp(lead, x.hypothesis, "Hypothesis")],
    summary: {
      fit: `${lead.stage} founder-led ${lead.category} SaaS in ${lead.market} with a ${lead.teamSize} person team.`,
      whyNow: x.whyNow,
      strongestEvidence: x.observed[0],
      uncertainties: x.uncertainty,
      nextAction: lead.nextAction,
    },
    evidenceUrls: [`https://${lead.domain}`, `https://${lead.domain}/pricing`, lead.buyer.profileUrl],
    approved: lead.researchStatus === "Completed" && !!det,
  };
}

export const DETAILED_RESEARCH_IDS = Object.keys(details);
