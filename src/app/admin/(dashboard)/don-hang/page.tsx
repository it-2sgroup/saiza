import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewSalesAnalytics } from "@/lib/admin/permissions";
import { getOrderList, getOrderStats, ZENSIP_SHOP_ID } from "@/lib/admin/tiktokOrders";
import { OrdersRealtime } from "./OrdersRealtime";

// Luôn render động — trang phụ thuộc dữ liệu DB live + phiên đăng nhập hiện
// tại, prerender tĩnh lúc build là vô nghĩa (và sẽ lỗi vì thiếu env lúc build).
export const dynamic = "force-dynamic";

/**
 * Trang xem đơn hàng ZENSIP + báo đơn mới real-time — chuyển từ
 * zensip-webapp (/admin/don-hang) sang khu quản trị SAIZA để tiện dùng
 * chung 1 chỗ, kể cả hiển thị trên màn hình TV/box Android qua trình duyệt.
 */
export default async function DonHangPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canViewSalesAnalytics(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const [stats, orders] = await Promise.all([
    getOrderStats(ZENSIP_SHOP_ID),
    getOrderList(ZENSIP_SHOP_ID, 50),
  ]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-5">
        <h1 className="text-2xl font-medium text-ink">Đơn hàng ZENSIP</h1>
        <p className="mt-1 text-sm text-ink-2">
          TikTok Shop — số liệu thật, đồng bộ trực tiếp từ hệ thống SOVA
        </p>
      </div>

      <OrdersRealtime initialStats={stats} initialOrders={orders} />
    </div>
  );
}
