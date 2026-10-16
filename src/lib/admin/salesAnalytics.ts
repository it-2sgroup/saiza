import "server-only";
import { createSalesAdminClient } from "@/lib/supabase/salesAdmin";

export type ProductSales = {
  platform: "shopee" | "tiktok";
  shopName: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type SalesSummary = {
  windowDays: number;
  totalRevenue: number;
  totalOrders: number;
  byPlatform: { platform: "shopee" | "tiktok"; revenue: number; orders: number }[];
  topProducts: ProductSales[];
};

// Order statuses that should NOT count as revenue. Deliberately an exclude
// list rather than `status === 'COMPLETED'` — this data source mixes
// English and Vietnamese status strings for the same platform (tiktok_orders
// has both "COMPLETED" and "Đã hoàn tất" for the same real state), so an
// include-list keyed on the English string alone silently drops ~40% of real
// completed orders. Excluding the known not-revenue states is shorter and
// doesn't depend on enumerating every completed-equivalent spelling.
const NOT_REVENUE_STATUSES = new Set([
  "CANCELLED",
  "Đã hủy",
  "UNPAID",
]);

// Bounded to the most recent rows for a given window — this page is a
// capability demo (and a general sales overview), not an exhaustive report,
// so it caps rows read per platform instead of paginating through months of
// order history.
const ROW_CAP = 3000;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

type ShopeeItemRow = {
  item_name: string | null;
  model_quantity_purchased: number | null;
  model_discounted_price: string | number | null;
  shops: { display_name: string | null } | { display_name: string | null }[] | null;
  shopee_orders:
    | { create_time: string | null; order_status: string | null }
    | { create_time: string | null; order_status: string | null }[]
    | null;
};

type TiktokItemRow = {
  product_id: string | null;
  quantity: number | null;
  unit_price: string | number | null;
  shops: { display_name: string | null } | { display_name: string | null }[] | null;
  tiktok_orders:
    | { created_at_tiktok: string | null; status: string | null }
    | { created_at_tiktok: string | null; status: string | null }[]
    | null;
};

// Supabase-js types embedded-to-one relations as an array in some generated
// typings; both this app and the source table FKs guarantee at most one row
// per item, so this just normalizes either shape to a single object.
function one<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function getSalesSummary(windowDays = 30): Promise<SalesSummary> {
  const sales = createSalesAdminClient();
  const cutoff = daysAgoIso(windowDays);

  const [shopeeRes, tiktokRes] = await Promise.all([
    sales
      .from("shopee_order_items")
      .select(
        "item_name, model_quantity_purchased, model_discounted_price, shops!inner(display_name), shopee_orders!inner(create_time, order_status)",
      )
      .gte("shopee_orders.create_time", cutoff)
      .order("create_time", { ascending: false, foreignTable: "shopee_orders" })
      .limit(ROW_CAP),
    sales
      .from("tiktok_order_items")
      .select(
        "product_id, quantity, unit_price, shops!inner(display_name), tiktok_orders!inner(created_at_tiktok, status)",
      )
      .gte("tiktok_orders.created_at_tiktok", cutoff)
      .order("created_at_tiktok", { ascending: false, foreignTable: "tiktok_orders" })
      .limit(ROW_CAP),
  ]);

  const shopeeRows = (shopeeRes.data ?? []) as unknown as ShopeeItemRow[];
  const tiktokRows = (tiktokRes.data ?? []) as unknown as TiktokItemRow[];

  // tiktok_order_items.product_id has no FK to tiktok_products (plain text
  // column), so the display name needs a second lookup instead of an
  // embedded select.
  const productIds = Array.from(
    new Set(tiktokRows.map((r) => r.product_id).filter((id): id is string => !!id)),
  );
  const { data: tiktokProducts } = productIds.length
    ? await sales
        .from("tiktok_products")
        .select("tiktok_product_id, name")
        .in("tiktok_product_id", productIds)
    : { data: [] as { tiktok_product_id: string; name: string | null }[] };
  const productNameById = new Map(
    (tiktokProducts ?? []).map((p) => [p.tiktok_product_id, p.name ?? p.tiktok_product_id]),
  );

  const byKey = new Map<string, ProductSales>();
  let shopeeRevenue = 0;
  let shopeeOrders = 0;
  let tiktokRevenue = 0;
  let tiktokOrders = 0;

  for (const row of shopeeRows) {
    const order = one(row.shopee_orders);
    if (!order || NOT_REVENUE_STATUSES.has(order.order_status ?? "")) continue;
    const shop = one(row.shops);
    const qty = row.model_quantity_purchased ?? 0;
    const price = Number(row.model_discounted_price ?? 0);
    const lineRevenue = qty * price;
    shopeeRevenue += lineRevenue;
    shopeeOrders += 1;
    const key = `shopee:${shop?.display_name ?? "?"}:${row.item_name ?? "?"}`;
    const prev = byKey.get(key);
    byKey.set(key, {
      platform: "shopee",
      shopName: shop?.display_name ?? "(không rõ shop)",
      productName: row.item_name ?? "(không rõ sản phẩm)",
      quantity: (prev?.quantity ?? 0) + qty,
      revenue: (prev?.revenue ?? 0) + lineRevenue,
    });
  }

  for (const row of tiktokRows) {
    const order = one(row.tiktok_orders);
    if (!order || NOT_REVENUE_STATUSES.has(order.status ?? "")) continue;
    const shop = one(row.shops);
    const qty = row.quantity ?? 0;
    const price = Number(row.unit_price ?? 0);
    const lineRevenue = qty * price;
    tiktokRevenue += lineRevenue;
    tiktokOrders += 1;
    const productName = row.product_id
      ? (productNameById.get(row.product_id) ?? row.product_id)
      : "(không rõ sản phẩm)";
    const key = `tiktok:${shop?.display_name ?? "?"}:${productName}`;
    const prev = byKey.get(key);
    byKey.set(key, {
      platform: "tiktok",
      shopName: shop?.display_name ?? "(không rõ shop)",
      productName,
      quantity: (prev?.quantity ?? 0) + qty,
      revenue: (prev?.revenue ?? 0) + lineRevenue,
    });
  }

  const topProducts = Array.from(byKey.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);

  return {
    windowDays,
    totalRevenue: shopeeRevenue + tiktokRevenue,
    totalOrders: shopeeOrders + tiktokOrders,
    byPlatform: [
      { platform: "shopee", revenue: shopeeRevenue, orders: shopeeOrders },
      { platform: "tiktok", revenue: tiktokRevenue, orders: tiktokOrders },
    ],
    topProducts,
  };
}
