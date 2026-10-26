import "server-only";
import { createSalesAdminClient } from "@/lib/supabase/salesAdmin";

export type ShopConnection = {
  id: string;
  platform: "shopee" | "tiktok";
  brandName: string;
  shopName: string;
  maskedShopId: string;
  status: string;
  lastOrdersSyncedAt: string | null;
};

type ShopRow = {
  id: string;
  platform: string;
  platform_shop_id: string | null;
  display_name: string | null;
  status: string | null;
  last_orders_synced_at: string | null;
  brands: { name: string | null } | { name: string | null }[] | null;
};

function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

// Shows only the tail of the platform's shop id — enough to tell shops apart
// in the UI without exposing the full identifier.
function maskId(id: string | null): string {
  if (!id) return "—";
  return id.length <= 4 ? id : `••••${id.slice(-4)}`;
}

export async function getShopConnections(): Promise<ShopConnection[]> {
  const sales = createSalesAdminClient();
  const { data } = await sales
    .from("shops")
    .select("id, platform, platform_shop_id, display_name, status, last_orders_synced_at, brands(name)")
    .in("platform", ["shopee", "tiktok"])
    .order("platform")
    .order("display_name");

  return ((data ?? []) as unknown as ShopRow[]).map((r) => ({
    id: r.id,
    platform: r.platform as "shopee" | "tiktok",
    brandName: one(r.brands)?.name ?? "—",
    shopName: r.display_name ?? "—",
    maskedShopId: maskId(r.platform_shop_id),
    status: r.status ?? "unknown",
    lastOrdersSyncedAt: r.last_orders_synced_at,
  }));
}
