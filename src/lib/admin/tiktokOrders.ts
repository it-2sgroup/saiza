import "server-only";
import { createSalesAdminClient } from "@/lib/supabase/salesAdmin";

/**
 * Đọc đơn hàng TikTok Shop của ZENSIP từ project nguồn dữ liệu (sismo-sync
 * order/sales warehouse) qua createSalesAdminClient() — cùng project đã
 * dùng cho "Phân tích doanh số" (xem salesAnalytics.ts). Chỉ gọi server-side,
 * gate bằng canViewSalesAnalytics(profile.role) ở nơi gọi.
 */

/** shop_id nội bộ của ZENSIP trong project nguồn dữ liệu (bảng shops). */
export const ZENSIP_SHOP_ID = "2af95db5-6265-4227-a8f3-d1a1b229dda2";

// Khớp đúng số "Cần gửi" trên TikTok Seller Center — TikTok chỉ tính
// AWAITING_COLLECTION vào đó, KHÔNG gồm UNPAID/AWAITING_SHIPMENT.
const STATUS_GROUPS = {
  awaiting_collection: ["AWAITING_COLLECTION"],
  in_transit: ["IN_TRANSIT"],
  // "delivered" gộp cả DELIVERED (đã giao, còn hạn hoàn) và COMPLETED (hết
  // hạn hoàn, coi như xong hẳn) — với người bán cả hai đều là "xong việc".
  delivered: ["DELIVERED", "COMPLETED"],
  cancelled: ["CANCELLED"],
} as const;

export type OrderCounts = {
  awaiting_collection: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
  total: number;
};

/** Đếm thật bằng COUNT (head:true) — không SELECT hết rồi đếm tay, tránh bị
 * PostgREST cap 1000 dòng/query làm sai số với shop nhiều đơn. */
export async function getOrderStats(shopId: string): Promise<OrderCounts> {
  const supabase = createSalesAdminClient();
  const counts = {} as Record<keyof typeof STATUS_GROUPS, number>;

  for (const [group, statuses] of Object.entries(STATUS_GROUPS) as [
    keyof typeof STATUS_GROUPS,
    readonly string[],
  ][]) {
    const { count, error } = await supabase
      .from("tiktok_orders")
      .select("*", { count: "exact", head: true })
      .eq("shop_id", shopId)
      .in("status", statuses as string[]);
    if (error) throw error;
    counts[group] = count ?? 0;
  }

  const { count: total, error: totalErr } = await supabase
    .from("tiktok_orders")
    .select("*", { count: "exact", head: true })
    .eq("shop_id", shopId);
  if (totalErr) throw totalErr;

  return { ...counts, total: total ?? 0 };
}

export type OrderListItem = {
  tiktok_order_id: string;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  created_at_tiktok: string | null;
  line_items: { product_name: string | null; sku_name: string | null }[];
};

function mapLineItems(rawJson: unknown): OrderListItem["line_items"] {
  const items = Array.isArray((rawJson as { line_items?: unknown[] })?.line_items)
    ? (rawJson as { line_items: unknown[] }).line_items
    : [];
  return items.map((li) => {
    const item = li as { product_name?: string | null; sku_name?: string | null };
    return { product_name: item.product_name ?? null, sku_name: item.sku_name ?? null };
  });
}

export async function getOrderList(shopId: string, limit = 50): Promise<OrderListItem[]> {
  const supabase = createSalesAdminClient();
  const { data, error } = await supabase
    .from("tiktok_orders")
    .select("tiktok_order_id, status, total_amount, currency, created_at_tiktok, raw_json")
    .eq("shop_id", shopId)
    .order("created_at_tiktok", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;

  // createSalesAdminClient() không có Database type generic nên supabase-js
  // suy ra Row = never — ép kiểu tường minh ở đây thay vì nới generic toàn
  // client.
  type RawOrderRow = {
    tiktok_order_id: string;
    status: string | null;
    total_amount: number | null;
    currency: string | null;
    created_at_tiktok: string | null;
    raw_json: unknown;
  };
  const rows = (data ?? []) as unknown as RawOrderRow[];

  return rows.map((o) => ({
    tiktok_order_id: o.tiktok_order_id,
    status: o.status,
    total_amount: o.total_amount,
    currency: o.currency,
    created_at_tiktok: o.created_at_tiktok,
    line_items: mapLineItems(o.raw_json),
  }));
}
