import type { Lead, OutreachChannel } from "@/types";

/** Simulated, template-based draft generation. No AI model or sending involved. */
export function draftOutreach(lead: Lead, channel: OutreachChannel, variant: number): string {
  const first = lead.buyer.name.split(" ")[0];
  const opp = lead.research?.opportunities.find((o) => o.kind === "Observed") ?? lead.research?.opportunities[0];
  const obs = (opp?.title ?? lead.designGap).replace(/\.$/, "");
  const area = (opp?.area ?? lead.designArea).toLowerCase();
  const recent = lead.research?.recentActivity[0];
  const v = variant % 2;

  switch (channel) {
    case "LinkedIn connection":
      return v
        ? `Hi ${first} — I lead EpicAura Studio, a product-design partner for founder-led SaaS teams. I've been following ${lead.company}${recent ? ` (${recent.toLowerCase()})` : ""} and would be glad to connect.`
        : `Hi ${first}, I run EpicAura Studio — we help B2B SaaS teams with ongoing product design. ${lead.company}'s work in ${lead.category.toLowerCase()} caught my eye. Happy to connect.`;
    case "LinkedIn DM":
      return `Hi ${first},\n\nThanks for connecting. While looking at ${lead.company}, one thing stood out: ${obs.charAt(0).toLowerCase() + obs.slice(1)}. That's often where ${area} improvements pay off quickly for ${lead.audience.toLowerCase()}.\n\n${v ? "If it's useful, I can share a short written teardown of that flow — no call needed." : "We work with small product teams as an ongoing design partner. Would a 20-minute conversation about how you're handling design today be worthwhile?"}\n\nDamani\nEpicAura Studio`;
    case "Cold email":
      return `Subject: ${v ? `A note on ${lead.company}'s ${area}` : `${lead.company} — ${area} idea`}\n\nHi ${first},\n\nI'm Damani from EpicAura Studio. We're a product-design partner for founder-led B2B SaaS companies that are shipping fast without a dedicated design function.\n\nLooking at ${lead.company} publicly, I noticed ${obs.charAt(0).toLowerCase() + obs.slice(1)}. I can't see your analytics, so this may already be on your radar — but it's the kind of thing we help teams improve as part of a monthly retainer.\n\n${v ? "Would you be open to a brief call next week?" : "Open to a short call to compare notes?"}\n\nBest,\nDamani Beckford\nEpicAura Studio`;
    case "Follow-up":
      return `Hi ${first}, following up on my earlier note about ${lead.company}'s ${area}. ${v ? "Happy to send a one-page summary instead if that's easier." : "No pressure either way — if the timing isn't right, I'll check back next quarter."}`;
  }
}
