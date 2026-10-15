import { useSyncExternalStore } from "react";
import { seedLeads } from "@/data/leads";
import { buildResearch, DETAILED_RESEARCH_IDS } from "@/data/research";
import { seedActivities, seedMappings, seedSessions, seedSpreadsheets, seedSyncRuns } from "@/data/seed";
import { DEFAULT_THRESHOLDS, DEFAULT_WEIGHTS, overallScore, tierFor } from "@/lib/scoring";
import type {
  Activity, AiSignal, BuyerRole, Category, ColumnMapping, CompanyStage, DesignArea, DiscoverySession,
  Lead, Market, Spreadsheet, SyncRun, TeamSize, Thresholds, Weights,
} from "@/types";

export interface Exclusions {
  preLaunch: boolean; b2cOnly: boolean; agencies: boolean; noDesignOpportunity: boolean;
  inactive: boolean; noCommercial: boolean; allowManualOverride: boolean;
}
export interface Icp {
  primaryMarkets: Market[]; secondaryMarkets: Market[]; sizes: TeamSize[]; stages: CompanyStage[];
  categories: Category[]; roles: BuyerRole[]; aiTools: AiSignal[]; areas: DesignArea[];
}
export interface GeneralSettings {
  workspaceName: string; ownerName: string; defaultMarkets: Market[]; defaultMax: number; defaultMinScore: number;
  density: "Comfortable" | "Compact"; pageSize: number;
  notifyResearch: boolean; notifyReplies: boolean; notifySync: boolean;
  sheetsAutoMark: boolean; exportFormat: "CSV" | "JSON"; includeEvidence: boolean;
}
export interface Notification { id: string; text: string; at: string; read: boolean; to?: string }

export interface AppState {
  signedIn: boolean;
  leads: Lead[];
  activities: Activity[];
  sessions: DiscoverySession[];
  weights: Weights;
  thresholds: Thresholds;
  icp: Icp;
  exclusions: Exclusions;
  settings: GeneralSettings;
  sheets: {
    connected: boolean; spreadsheets: Spreadsheet[]; spreadsheetId: string; worksheetId: string;
    mappings: ColumnMapping[]; mode: "append" | "update"; runs: SyncRun[]; lastSync?: string;
  };
  notifications: Notification[];
}

function initial(): AppState {
  const leads = seedLeads.map((l) =>
    DETAILED_RESEARCH_IDS.includes(l.id) || l.researchStatus === "Completed" || l.researchStatus === "Needs review"
      ? { ...l, research: buildResearch(l) }
      : l,
  );
  return {
    signedIn: false,
    leads,
    activities: seedActivities,
    sessions: seedSessions,
    weights: { ...DEFAULT_WEIGHTS },
    thresholds: { ...DEFAULT_THRESHOLDS },
    icp: {
      primaryMarkets: ["United States", "Jamaica"], secondaryMarkets: ["Wider Caribbean"],
      sizes: ["1–5", "6–10", "11–20"], stages: ["Post-launch", "Early Traction", "Actively Acquiring Customers"],
      categories: ["Fintech", "HRTech", "HealthTech", "EdTech", "MarTech", "Operations", "Logistics", "Vertical SaaS"],
      roles: ["Founder/CEO", "CTO", "Head of Product"],
      aiTools: ["Lovable", "Bolt", "Replit", "Cursor", "Claude", "Other AI tools"],
      areas: ["Onboarding", "Workflow UX", "Usability", "Feature Design", "UX Consistency", "Product Strategy"],
    },
    exclusions: { preLaunch: true, b2cOnly: true, agencies: true, noDesignOpportunity: true, inactive: true, noCommercial: false, allowManualOverride: true },
    settings: {
      workspaceName: "EpicAura Studio", ownerName: "Damani B.", defaultMarkets: ["United States", "Jamaica"],
      defaultMax: 25, defaultMinScore: 45, density: "Comfortable", pageSize: 10,
      notifyResearch: true, notifyReplies: true, notifySync: true, sheetsAutoMark: true, exportFormat: "CSV", includeEvidence: true,
    },
    sheets: {
      connected: false, spreadsheets: seedSpreadsheets, spreadsheetId: "SS-1", worksheetId: "W-1",
      mappings: seedMappings, mode: "update", runs: seedSyncRuns, lastSync: seedSyncRuns[0].at,
    },
    notifications: [
      { id: "N-1", text: "Cargomint replied to your LinkedIn message", at: seedActivities[9].at, read: false, to: "/leads/L-1003" },
      { id: "N-2", text: "Fleetbook research needs review", at: seedActivities[5].at, read: false, to: "/research" },
      { id: "N-3", text: "Demo sync preview ready for EpicAura Leads 2026", at: seedActivities[3].at, read: true, to: "/sheets" },
    ],
  };
}

const KEY = "epicaura-lead-agent-v1";
let state: AppState = initial();
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined" && hydrated) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore quota */ }
  }
}

export function hydrateStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { state = { ...initial(), ...JSON.parse(raw) }; listeners.forEach((l) => l()); }
  } catch { /* ignore */ }
}

export function getState() { return state; }
export function setState(fn: (s: AppState) => AppState) { state = fn(state); emit(); }
export function resetDemo() { state = initial(); emit(); }

// Demo-only auth: no real accounts, just a flag persisted with the rest of the state.
export function signIn() { setState((s) => ({ ...s, signedIn: true })); }
export function signOut() { setState((s) => ({ ...s, signedIn: false })); }

const serverSnap = initial();
export function useApp<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => sel(state),
    () => sel(serverSnap),
  );
}

let idc = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${(idc++).toString(36)}`;
export const now = () => new Date().toISOString();

export function log(a: Omit<Activity, "id" | "at">) {
  setState((s) => ({ ...s, activities: [{ ...a, id: uid("A"), at: now() }, ...s.activities] }));
}

export function notify(text: string, to?: string) {
  setState((s) => ({ ...s, notifications: [{ id: uid("N"), text, at: now(), read: false, to }, ...s.notifications] }));
}

export function updateLead(id: string, patch: Partial<Lead> | ((l: Lead) => Partial<Lead>)) {
  setState((s) => ({
    ...s,
    leads: s.leads.map((l) => (l.id === id ? { ...l, ...(typeof patch === "function" ? patch(l) : patch), lastActivity: now() } : l)),
  }));
}

export function scoreOf(l: Lead, s: AppState = state) { return overallScore(l.scores, s.weights); }
export function tierOf(l: Lead, s: AppState = state) { return tierFor(scoreOf(l, s), s.thresholds); }

export function useScore(l: Lead) {
  const weights = useApp((s) => s.weights);
  const thresholds = useApp((s) => s.thresholds);
  const score = overallScore(l.scores, weights);
  return { score, tier: tierFor(score, thresholds) };
}

export function setStatus(id: string, status: Lead["status"]) {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead || lead.status === status) return;
  const qualified = !["Discovered", "Researching", "Rejected"].includes(status);
  updateLead(id, { status, qualified });
  log({ type: "Status", title: `Moved to ${status}`, subject: lead.company, leadId: id, outcome: status === "Lost" || status === "Rejected" ? "Warning" : "Success", details: `Stage changed from ${lead.status} to ${status}.` });
}

export function qualifyLead(id: string): { ok: boolean; reason?: string } {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead) return { ok: false };
  const sc = scoreOf(lead);
  if (sc < state.thresholds.qualified) return { ok: false, reason: `${lead.company} scores ${sc}, below the qualified threshold of ${state.thresholds.qualified}.` };
  updateLead(id, { status: "Qualified", qualified: true, sheetSync: state.settings.sheetsAutoMark ? "Marked for sync" : lead.sheetSync });
  log({ type: "Qualification", title: "Marked as qualified", subject: lead.company, leadId: id, outcome: "Success", details: `Score ${sc}, ${tierFor(sc, state.thresholds)}.` });
  return { ok: true };
}

export function queueResearch(ids: string[]) {
  setState((s) => ({
    ...s,
    leads: s.leads.map((l) => ids.includes(l.id) && l.researchStatus === "Not started"
      ? { ...l, researchStatus: "Queued", status: l.status === "Discovered" ? "Researching" : l.status, lastActivity: now() } : l),
  }));
  log({ type: "Research", title: `${ids.length} prospect${ids.length > 1 ? "s" : ""} added to research queue`, subject: "Research queue", outcome: "Info", details: ids.map((i) => state.leads.find((l) => l.id === i)?.company).join(", ") });
}

export function completeResearch(id: string, variant = 0) {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead) return;
  // Simulated re-run nudges evidence slightly so the score visibly re-computes.
  const bump = variant ? 0.03 : 0;
  const scores = { ...lead.scores, design: Math.min(1, lead.scores.design + bump), timing: Math.min(1, lead.scores.timing + bump) };
  updateLead(id, { researchStatus: "Completed", research: buildResearch({ ...lead, scores }, variant), lastResearched: now(), scores });
  log({ type: "Research", title: variant ? "Research re-run (simulated)" : "Research completed", subject: lead.company, leadId: id, outcome: "Success", details: "Mock research generated: product analysis, AI signals, design audit, buyer research." });
  if (state.settings.notifyResearch) notify(`Research completed for ${lead.company}`, `/leads/${id}`);
}
