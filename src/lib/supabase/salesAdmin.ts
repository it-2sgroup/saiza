import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role, READ-ONLY-BY-CONVENTION client for a SEPARATE Supabase
// project (the sismo-sync order/sales data warehouse — tiktok_orders,
// shopee_orders, etc.), unrelated to this app's own database. Only ever
// call from a Server Component/Route Handler gated by
// canViewSalesAnalytics(profile.role) — this key bypasses RLS entirely and
// this project holds real customer order data across every shop, not just
// this site's own content.
//
// Separate env vars on purpose (not reusing SUPABASE_SERVICE_ROLE_KEY/
// NEXT_PUBLIC_SUPABASE_URL) since that pair points at this app's own CMS
// database — a different project with a different service-role key.
export function createSalesAdminClient() {
  return createSupabaseClient(
    process.env.SALES_SUPABASE_URL!,
    process.env.SALES_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
