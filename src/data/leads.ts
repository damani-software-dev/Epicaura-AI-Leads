import type {
  AiSignal, BuyerRole, Category, CompanyStage, CriterionScores, DesignArea, Lead, LeadStatus,
  Market, ResearchStatus, TeamSize,
} from "@/types";

const d = (daysAgo: number, h = 10) => {
  const t = new Date("2026-10-14T00:00:00Z");
  t.setUTCDate(t.getUTCDate() - daysAgo);
  t.setUTCHours(h);
  return t.toISOString();
};

type Seed = [
  id: string, company: string, domain: string, country: string, market: Market, category: Category,
  stage: CompanyStage, size: TeamSize, ai: AiSignal, buyerName: string, role: BuyerRole,
  area: DesignArea, gap: string, scores: [number, number, number, number, number, number],
  research: ResearchStatus, status: LeadStatus, retainer: number | undefined, daysAgo: number,
  description: string, audience: string, next: string,
];

const seeds: Seed[] = [
  ["L-1001", "Ledgerloop", "ledgerloop.example", "Kingston, Jamaica", "Jamaica", "Fintech", "Actively Acquiring Customers", "6–10", "Lovable", "Marcia Henry", "Founder/CEO", "Onboarding", "Multi-step business verification with no progress cues", [0.95, 0.9, 0.85, 0.9, 0.8, 1], "Completed", "Outreach Ready", 6500, 1, "Invoicing and reconciliation for Caribbean SMEs that bill in multiple currencies.", "Small and mid-size businesses in Jamaica and Trinidad", "Send LinkedIn connection to Marcia"],
  ["L-1002", "Shiftwell", "shiftwell.example", "Austin, TX, USA", "United States", "HRTech", "Early Traction", "11–20", "Cursor", "Daniel Ortiz", "Head of Product", "Workflow UX", "Shift-swap flow requires five screens and manual approvals", [0.9, 0.9, 0.85, 0.8, 0.85, 0.8], "Completed", "Contacted", 8000, 2, "Shift scheduling and swaps for multi-location clinics and retail.", "Operations managers at hourly-workforce businesses", "Follow up on LinkedIn DM (sent Oct 9)"],
  ["L-1003", "Cargomint", "cargomint.example", "Miami, FL, USA", "United States", "Logistics", "Actively Acquiring Customers", "6–10", "Unknown", "Priya Natarajan", "Founder/CEO", "Feature Design", "Shipment exceptions buried in a dense table view", [0.85, 0.85, 0.9, 0.85, 0.7, 0.3], "Completed", "Replied", 7500, 3, "Freight booking and tracking for US–Caribbean small importers.", "Small importers and customs brokers", "Propose discovery call times"],
  ["L-1004", "Clinicnest", "clinicnest.example", "Montego Bay, Jamaica", "Jamaica", "HealthTech", "Early Traction", "1–5", "Bolt", "Andre Campbell", "Founder/CEO", "Usability", "Appointment booking unclear on mobile; inconsistent buttons", [0.9, 0.85, 0.65, 0.85, 0.75, 1], "Completed", "Qualified", 4500, 2, "Patient booking and reminders for private clinics.", "Private medical and dental practices", "Prepare personalized outreach"],
  ["L-1005", "Tallyroom", "tallyroom.example", "Denver, CO, USA", "United States", "Operations", "Post-launch", "1–5", "Replit", "Hannah Weiss", "Founder/CEO", "Product Strategy", "Feature set expanding without clear information architecture", [0.85, 0.7, 0.55, 0.8, 0.6, 1], "Completed", "Qualified", 4000, 4, "Inventory counts and audit trails for small warehouses.", "Warehouse leads at SMB distributors", "Validate pricing evidence"],
  ["L-1006", "Learnlane", "learnlane.example", "Port of Spain, Trinidad", "Wider Caribbean", "EdTech", "Early Traction", "6–10", "Claude", "Kerry-Ann Joseph", "CTO", "UX Consistency", "Teacher and admin dashboards use different patterns", [0.8, 0.8, 0.7, 0.75, 0.7, 0.8], "Completed", "Discovery Call", 5500, 1, "Course delivery and grading for vocational training institutes.", "Training institutes across CARICOM", "Discovery call Oct 17, 2:00 PM"],
  ["L-1007", "Pipewise", "pipewise.example", "Brooklyn, NY, USA", "United States", "MarTech", "Actively Acquiring Customers", "11–20", "Cursor", "Sam Okafor", "CTO", "Onboarding", "Integration setup is the first step; high early drop-off risk", [0.85, 0.8, 0.9, 0.7, 0.9, 0.8], "Completed", "Proposal", 9500, 0, "Attribution and pipeline reporting for B2B marketing teams.", "Marketing ops at Series A–B SaaS", "Send revised proposal by Oct 16"],
  ["L-1008", "Rentroll", "rentroll.example", "Kingston, Jamaica", "Jamaica", "Vertical SaaS", "Post-launch", "1–5", "Lovable", "Tasha Brown", "Founder/CEO", "Usability", "Tenant ledger hard to scan; no empty states", [0.9, 0.75, 0.6, 0.85, 0.65, 1], "Completed", "Won", 4500, 6, "Property management for small Jamaican landlords.", "Landlords with 5–50 units", "Kickoff scheduled"],
  ["L-1009", "Docketly", "docketly.example", "Chicago, IL, USA", "United States", "Vertical SaaS", "Early Traction", "6–10", "Unknown", "Michael Grant", "Founder/CEO", "Workflow UX", "Case intake form is a single long page", [0.8, 0.75, 0.75, 0.6, 0.5, 0.2], "Completed", "Lost", 6000, 9, "Matter intake and deadlines for small law firms.", "Solo and small-firm attorneys", "Revisit in Q1 2027"],
  ["L-1010", "Fleetbook", "fleetbook.example", "Nassau, Bahamas", "Wider Caribbean", "Logistics", "Post-launch", "6–10", "Other AI tools", "Ricardo Ferguson", "Head of Product", "Feature Design", "Route planner lacks clear editing states", [0.75, 0.7, 0.6, 0.65, 0.55, 0.6], "Needs review", "Researching", undefined, 1, "Delivery routing for island distributors.", "Distributors and couriers", "Confirm team size and buyer"],
  ["L-1011", "Payrella", "payrella.example", "Atlanta, GA, USA", "United States", "Fintech", "Actively Acquiring Customers", "21–50", "Unknown", "Grace Lin", "Head of Product", "UX Consistency", "Mixed component styles across billing settings", [0.65, 0.7, 0.9, 0.6, 0.8, 0.2], "In progress", "Researching", undefined, 0, "Payroll add-on for contractor-heavy agencies.", "Agencies paying 1099 contractors", "Finish buyer research"],
  ["L-1012", "Huddlepost", "huddlepost.example", "Ocho Rios, Jamaica", "Jamaica", "Operations", "Early Traction", "1–5", "Bolt", "Jermaine Reid", "Founder/CEO", "Onboarding", "Workspace setup asks for team invites before value is shown", [0.85, 0.7, 0.5, 0.8, 0.6, 1], "Queued", "Discovered", undefined, 1, "Internal announcements and checklists for hospitality teams.", "Hotel and resort operations teams", "Start research"],
  ["L-1013", "Quillbase", "quillbase.example", "Portland, OR, USA", "United States", "Other", "Post-launch", "1–5", "Lovable", "Nora Patel", "Founder/CEO", "Usability", "Editor toolbar overloaded; settings hidden", [0.7, 0.65, 0.4, 0.75, 0.5, 1], "Queued", "Discovered", undefined, 2, "Proposal writing workspace for B2B consultancies.", "Consultancies and agencies", "Start research"],
  ["L-1014", "Vitalgrid", "vitalgrid.example", "Bridgetown, Barbados", "Wider Caribbean", "HealthTech", "Early Traction", "11–20", "Unknown", "Simone Clarke", "CTO", "Workflow UX", "Lab result review requires repeated navigation", [0.75, 0.75, 0.7, 0.55, 0.6, 0.2], "Not started", "Discovered", undefined, 3, "Lab results portal for regional diagnostic labs.", "Diagnostic labs and clinics", "Add to research queue"],
  ["L-1015", "Brightdesk", "brightdesk.example", "Raleigh, NC, USA", "United States", "Operations", "Actively Acquiring Customers", "11–20", "Replit", "Owen Mitchell", "Founder/CEO", "Product Strategy", "Roadmap shows rapid feature growth; nav already crowded", [0.8, 0.75, 0.8, 0.7, 0.75, 0.8], "Not started", "Discovered", undefined, 2, "Front-desk visitor and package management for offices.", "Office and facilities managers", "Add to research queue"],
  ["L-1016", "Tutorhive", "tutorhive.example", "Spanish Town, Jamaica", "Jamaica", "EdTech", "Post-launch", "1–5", "Lovable", "Kimberley Watson", "Founder/CEO", "Onboarding", "Parent signup and student linking unclear", [0.8, 0.7, 0.45, 0.75, 0.55, 1], "Not started", "Discovered", undefined, 4, "Tutor scheduling and payments for Jamaican tutoring centers.", "Tutoring centers and independent tutors", "Add to research queue"],
  ["L-1017", "Stackfare", "stackfare.example", "San Diego, CA, USA", "United States", "Vertical SaaS", "Early Traction", "6–10", "Cursor", "Ethan Brooks", "CTO", "Feature Design", "Menu costing tool lacks guidance on first use", [0.8, 0.7, 0.7, 0.65, 0.6, 0.8], "Not started", "Discovered", undefined, 5, "Food cost and menu engineering for independent restaurants.", "Independent restaurant owners", "Add to research queue"],
  ["L-1018", "Glowcart", "glowcart.example", "Los Angeles, CA, USA", "United States", "Other", "Post-launch", "1–5", "Bolt", "Lily Chen", "Founder/CEO", "Usability", "Consumer-facing storefront; B2B fit unclear", [0.35, 0.5, 0.4, 0.6, 0.4, 1], "Completed", "Rejected", undefined, 7, "Skincare subscription storefront builder.", "Consumers (B2C)", "Excluded: B2C-only"],
  ["L-1019", "Auditly", "auditly.example", "Castries, St. Lucia", "Wider Caribbean", "Fintech", "Post-launch", "1–5", "Unknown", "Marcus Joseph", "Founder/CEO", "UX Consistency", "Report builder visuals inconsistent with app", [0.7, 0.55, 0.45, 0.5, 0.4, 0.2], "Not started", "Discovered", undefined, 6, "Compliance checklists for credit unions.", "Credit unions in the OECS", "Needs evidence of activity"],
  ["L-1020", "Crewclock", "crewclock.example", "Houston, TX, USA", "United States", "HRTech", "Actively Acquiring Customers", "6–10", "Claude", "Rachel Adams", "Head of Product", "Workflow UX", "Timesheet approvals require many clicks per crew", [0.85, 0.8, 0.8, 0.75, 0.8, 0.8], "Completed", "Qualified", 7000, 1, "Time tracking for field-service crews.", "Field-service contractors", "Prepare outreach"],
  ["L-1021", "Mediroute", "mediroute.example", "Mandeville, Jamaica", "Jamaica", "HealthTech", "Post-launch", "1–5", "Unknown", "Paul Bennett", "CTO", "Usability", "Prescription delivery tracker hard to read", [0.75, 0.6, 0.5, 0.55, 0.45, 0.2], "Not started", "Discovered", undefined, 8, "Pharmacy delivery coordination.", "Independent pharmacies", "Add to research queue"],
  ["L-1022", "Formcraft", "formcraft.example", "Seattle, WA, USA", "United States", "Other", "Post-launch", "50+", "Unknown", "Dana Ruiz", "Head of Product", "UX Consistency", "Large in-house design team visible on careers page", [0.3, 0.25, 0.8, 0.4, 0.5, 0.2], "Not started", "Discovered", undefined, 10, "Enterprise form automation platform.", "Enterprise IT", "Likely low fit"],
];

const first = (n: string) => n.split(" ")[0].toLowerCase();

export const seedLeads: Lead[] = seeds.map((s) => {
  const [id, company, domain, country, market, category, stage, teamSize, aiSignal, buyerName, role, designArea, designGap, sc, researchStatus, status, estRetainer, daysAgo, description, audience, nextAction] = s;
  const scores: CriterionScores = { icp: sc[0], design: sc[1], commercial: sc[2], buyer: sc[3], timing: sc[4], ai: sc[5] };
  const qualified = !["Discovered", "Researching", "Rejected"].includes(status);
  return {
    id, company, domain, country, market, category, stage, teamSize, aiSignal, designArea, designGap,
    description, audience, scores, researchStatus, status, qualified, estRetainer, nextAction,
    owner: ["Damani B.", "Alicia M.", "Damani B."][Number(id.slice(-1)) % 3],
    lastActivity: d(daysAgo, 9 + (Number(id.slice(-2)) % 8)),
    lastResearched: researchStatus === "Completed" || researchStatus === "Needs review" ? d(daysAgo + 1) : undefined,
    followUp: qualified && status !== "Won" && status !== "Lost" ? d(-3) : undefined,
    buyer: {
      name: buyerName, role,
      profileUrl: `https://linkedin.example/in/${buyerName.toLowerCase().replace(/[^a-z]+/g, "-")}`,
      contactPage: `https://${domain}/contact`,
      email: Number(id.slice(-1)) % 3 === 0 ? `hello@${domain}` : undefined,
      verification: Number(id.slice(-1)) % 3 === 0 ? "Source found" : "Unverified",
    },
    notes: qualified ? [{ id: `${id}-n1`, text: `Spoke internally: ${first(buyerName)} appears to own product decisions.`, at: d(daysAgo + 1) }] : [],
    drafts: [],
    sheetSync: qualified ? (Number(id.slice(-1)) % 2 ? "Demo synced" : "Marked for sync") : "Not synced",
    inDiscovery: false,
  };
});
