import { isValidDisplayToken } from "@/lib/admin/displayToken";
import { getOrderList, getOrderStats, ZENSIP_SHOP_ID } from "@/lib/admin/tiktokOrders";
import { DisplayOrders } from "./DisplayOrders";

// Luôn render động — phụ thuộc dữ liệu DB live + token truyền qua query,
// prerender tĩnh lúc build là vô nghĩa.
export const dynamic = "force-dynamic";

/**
 * Bản hiển thị "chỉ để xem" của /admin/don-hang, dành riêng cho màn hình
 * TV/box Android chạy trình duyệt đời cũ — xem displayToken.ts (xác thực
 * bằng token) và display.css (CSS thuần, không qua Tailwind) để biết lý do.
 * Cập nhật bằng cách polling fetch định kỳ, không dùng SSE/WebSocket.
 */
export default async function DisplayDonHangPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!isValidDisplayToken(token)) {
    return (
      <div className="dpo-page">
        <p className="dpo-empty">Không có quyền truy cập trang này.</p>
      </div>
    );
  }

  const [stats, orders] = await Promise.all([
    getOrderStats(ZENSIP_SHOP_ID),
    getOrderList(ZENSIP_SHOP_ID, 50),
  ]);

  return <DisplayOrders initialStats={stats} initialOrders={orders} token={token!} />;
}
