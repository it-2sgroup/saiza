import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewSalesAnalytics } from "@/lib/admin/permissions";
import { getOrderList, getOrderStats, ZENSIP_SHOP_ID } from "@/lib/admin/tiktokOrders";

/**
 * Trả về {stats, orders} cho trang /admin/don-hang — dùng cho nút "Tải thêm"
 * và polling định kỳ phía client.
 */
export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Bạn cần đăng nhập lại." }, { status: 401 });
  }
  if (!(await canViewSalesAnalytics(profile.role))) {
    return NextResponse.json({ error: "Bạn không có quyền dùng chức năng này." }, { status: 403 });
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 50;

  try {
    const [stats, orders] = await Promise.all([
      getOrderStats(ZENSIP_SHOP_ID),
      getOrderList(ZENSIP_SHOP_ID, limit),
    ]);
    return NextResponse.json({ ok: true, stats, orders });
  } catch (err) {
    console.error("[admin/orders] lỗi:", err);
    return NextResponse.json({ error: "Không lấy được dữ liệu đơn hàng." }, { status: 500 });
  }
}
