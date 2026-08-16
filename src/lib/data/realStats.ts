/**
 * Snapshot from Supabase project "SOVA" (jjarzdxyarwobruzdqbg), queried 16/08/2026.
 * Scoped to SAIZA's own shops only — Shopee #1023476268 and TikTok "SAIZA.VN" —
 * excluding the separate "SU Việt Nam" shop in the same database.
 * Not live-updating yet: this is a static snapshot until the backend (Phase 2) wires
 * up a real API route to query Supabase at request/build time.
 */
export type RealStatId = "orders" | "units" | "views" | "lives" | "creators";

export type RealStat = {
  id: RealStatId;
  target: number;
  decimals: number;
  grouped: boolean;
};

export const realStats: RealStat[] = [
  { id: "orders", target: 443578, decimals: 0, grouped: true },
  { id: "units", target: 462885, decimals: 0, grouped: true },
  { id: "views", target: 64.6, decimals: 1, grouped: false },
  { id: "lives", target: 34454, decimals: 0, grouped: true },
  { id: "creators", target: 9083, decimals: 0, grouped: true },
];
