import { NextResponse } from "next/server";
import { isValidDisplayToken } from "@/lib/admin/displayToken";
import { getOrderList, getOrderStats, ZENSIP_SHOP_ID } from "@/lib/admin/tiktokOrders";

/**
 * Nguồn dữ liệu cho /display/don-hang — xác thực bằng token trong query
 * string (xem displayToken.ts), KHÔNG dùng cookie session như
 * /api/admin/orders, vì màn hình TV mở 1 lần rồi chạy nền vô thời hạn,
 * không có cách nào đăng nhập lại khi cookie hết hạn.
 */
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!isValidDisplayToken(token)) {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }

  const limitParam = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 50;

  try {
    const [stats, orders] = await Promise.all([
      getOrderStats(ZENSIP_SHOP_ID),
      getOrderList(ZENSIP_SHOP_ID, limit),
    ]);
    return NextResponse.json({ ok: true, stats, orders, servedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[display/don-hang] lỗi:", err);
    return NextResponse.json({ error: "Không lấy được dữ liệu đơn hàng." }, { status: 500 });
  }
}
