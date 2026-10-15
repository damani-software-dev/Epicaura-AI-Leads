import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/lib/supabase/admin.server";
import type { DiscoveryFilters, Lead } from "@/types";
import { seedLeads } from "@/data/leads";

export const discoverLeads = createServerFn({ method: "POST" })
  .inputValidator((d: { filters: DiscoveryFilters; name: string }) => d)
  .handler(async ({ data }): Promise<{ leads: Lead[]; sessionId: string }> => {
    const db = supabaseAdmin();

    const { data: rows, error } = await db.from("leads").select("data").limit(200);
    if (error) throw new Error(error.message);

    const leads = (rows ?? []).map((r) => r.data as Lead);
    const any = <T,>(a: T[], v: T) => a.length === 0 || a.includes(v);
    const f = data.filters;
    const matched = leads
      .filter((l) => l.status !== "Rejected"
        && any(f.markets, l.market) && any(f.stages, l.stage) && any(f.sizes, l.teamSize)
        && any(f.categories, l.category) && any(f.aiSignals, l.aiSignal)
        && any(f.roles, l.buyer.role) && any(f.areas, l.designArea))
      .slice(0, f.max);

    const sessionId = `S-${Date.now().toString(36)}`;
    const { error: sErr } = await db.from("discovery_sessions").insert({
      id: sessionId, name: data.name, filters: f, result_ids: matched.map((l) => l.id),
    });
    if (sErr) throw new Error(sErr.message);

    return { leads: matched, sessionId };
  });

  export const seedLeadsToDb = createServerFn({ method: "POST" }).handler(async () => {
    try {
      const db = supabaseAdmin();
      const { count, error: cErr } = await db.from("leads").select("id", { count: "exact", head: true });
      if (cErr) throw new Error(`count failed: ${cErr.message}`);
      if (count && count > 0) return { inserted: 0, message: "Already seeded" };
  
      const rows = seedLeads.map((l) => ({
        id: l.id, domain: l.domain, company: l.company, data: l, source_urls: [],
      }));
      const { error } = await db.from("leads").upsert(rows, { onConflict: "domain" });
      if (error) throw new Error(`upsert failed: ${error.message}`);
      return { inserted: rows.length, message: "Seeded" };
    } catch (e) {
      console.error("SEED ERROR:", e, (e as any)?.cause);
      throw e;
    }
  });