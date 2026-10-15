export type Market = "United States" | "Jamaica" | "Wider Caribbean";
export type Category =
  | "Fintech" | "HRTech" | "HealthTech" | "EdTech" | "MarTech"
  | "Operations" | "Logistics" | "Vertical SaaS" | "Other";
export type CompanyStage = "Post-launch" | "Early Traction" | "Actively Acquiring Customers";
export type TeamSize = "1–5" | "6–10" | "11–20" | "21–50" | "50+";
export type AiSignal = "Lovable" | "Bolt" | "Replit" | "Cursor" | "Claude" | "Other AI tools" | "Unknown";
export type BuyerRole = "Founder/CEO" | "CTO" | "Head of Product";
export type DesignArea =
  | "Onboarding" | "Workflow UX" | "Usability" | "Feature Design" | "UX Consistency" | "Product Strategy";
export type Confidence = "High" | "Medium" | "Low";

export type ResearchStatus = "Not started" | "Queued" | "In progress" | "Completed" | "Needs review";

export const LEAD_STATUSES = [
  "Discovered", "Researching", "Qualified", "Outreach Ready", "Contacted",
  "Replied", "Discovery Call", "Proposal", "Won", "Lost", "Rejected",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PIPELINE_STAGES: LeadStatus[] = [
  "Qualified", "Outreach Ready", "Contacted", "Replied", "Discovery Call", "Proposal", "Won", "Lost",
];

export type CriterionKey = "icp" | "design" | "commercial" | "buyer" | "timing" | "ai";
export type Weights = Record<CriterionKey, number>;
/** Raw evidence strength per criterion, 0–1. */
export type CriterionScores = Record<CriterionKey, number>;

export type Tier = "High Priority" | "Qualified" | "Needs Review" | "Low Priority";
export interface Thresholds { high: number; qualified: number; review: number }

export interface Buyer {
  name: string;
  role: BuyerRole;
  profileUrl: string;
  email?: string;
  contactPage: string;
  verification: "Unverified" | "Source found" | "Not found";
}

export interface DesignOpportunity {
  title: string;
  area: DesignArea;
  evidence: string;
  whyItMatters: string;
  intervention: string;
  confidence: Confidence;
  kind: "Observed" | "Hypothesis";
  commercialRelevance: "High" | "Medium" | "Low";
}

export interface Research {
  whatItDoes: string;
  serves: string;
  features: string[];
  liveEvidence: string;
  acquisitionSignals: string[];
  pricing: string;
  recentActivity: string[];
  ai: { tool: AiSignal; source: string; summary: string; confidence: Confidence; lastChecked: string };
  opportunities: DesignOpportunity[];
  summary: { fit: string; whyNow: string; strongestEvidence: string; uncertainties: string; nextAction: string };
  evidenceUrls: string[];
  approved?: boolean;
}

export interface Note { id: string; text: string; at: string }
export interface OutreachDraft { id: string; channel: OutreachChannel; text: string; at: string }
export type OutreachChannel = "LinkedIn connection" | "LinkedIn DM" | "Cold email" | "Follow-up";

export interface Lead {
  id: string;
  company: string;
  domain: string;
  description: string;
  country: string;
  market: Market;
  category: Category;
  stage: CompanyStage;
  teamSize: TeamSize;
  aiSignal: AiSignal;
  audience: string;
  buyer: Buyer;
  designArea: DesignArea;
  designGap: string;
  scores: CriterionScores;
  researchStatus: ResearchStatus;
  status: LeadStatus;
  qualified: boolean;
  estRetainer?: number;
  owner: string;
  lastActivity: string;
  lastResearched?: string;
  nextAction: string;
  followUp?: string;
  notes: Note[];
  drafts: OutreachDraft[];
  sheetSync: "Not synced" | "Marked for sync" | "Demo synced";
  research?: Research;
  inDiscovery?: boolean;
}

export type ActivityType =
  | "Discovery" | "Prospect" | "Research" | "Qualification" | "Status" | "Outreach"
  | "Sheets preview" | "Sheets sync" | "Configuration";

export interface Activity {
  id: string;
  at: string;
  type: ActivityType;
  title: string;
  subject: string;
  leadId?: string;
  outcome: "Success" | "Info" | "Warning" | "Failed";
  details: string;
}

export interface DiscoveryFilters {
  name: string;
  markets: Market[];
  stages: CompanyStage[];
  sizes: TeamSize[];
  categories: Category[];
  aiSignals: AiSignal[];
  roles: BuyerRole[];
  areas: DesignArea[];
  minScore: number;
  max: number;
}

export interface DiscoverySession {
  id: string;
  name: string;
  at: string;
  filters: DiscoveryFilters;
  resultIds: string[];
  researched: number;
  qualified: number;
}

export interface Worksheet { id: string; name: string; rows: number }
export interface Spreadsheet { id: string; name: string; worksheets: Worksheet[] }
export interface ColumnMapping { key: string; label: string; enabled: boolean; required?: boolean }
export interface SyncRun {
  id: string; at: string; spreadsheet: string; worksheet: string;
  processed: number; created: number; updated: number; skipped: number;
  outcome: "Success" | "Failed"; details: string;
}
