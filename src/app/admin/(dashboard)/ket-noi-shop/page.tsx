import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewSalesAnalytics } from "@/lib/admin/permissions";
import { getShopConnections } from "@/lib/admin/shopConnections";

const PLATFORM_LABEL: Record<string, string> = {
  shopee: "Shopee",
  tiktok: "TikTok Shop",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Đang kết nối",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "Chưa đồng bộ";
  return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

export default async function ShopConnectionsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canViewSalesAnalytics(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const shops = await getShopConnections();
  const brandCount = new Set(shops.map((s) => s.brandName)).size;
  const platformCount = new Set(shops.map((s) => s.platform)).size;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Kết nối shop</h1>
        <p className="text-sm text-ink-2">
          Các shop đã được ủy quyền và đồng bộ đơn hàng về hệ thống (Shop connections).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-line bg-card p-5">
          <div className="text-xs font-semibold text-ink-2">Shop đang kết nối</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{shops.length}</div>
        </div>
        <div className="rounded-card border border-line bg-card p-5">
          <div className="text-xs font-semibold text-ink-2">Thương hiệu / Seller</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{brandCount}</div>
        </div>
        <div className="rounded-card border border-line bg-card p-5">
          <div className="text-xs font-semibold text-ink-2">Sàn TMĐT</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{platformCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-wash text-xs font-semibold text-ink-2">
            <tr>
              <th className="px-4 py-3">Sàn</th>
              <th className="px-4 py-3">Thương hiệu / Seller</th>
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Mã shop</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Đồng bộ đơn hàng gần nhất</th>
            </tr>
          </thead>
          <tbody>
            {shops.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-2">
                  Chưa có shop nào được kết nối.
                </td>
              </tr>
            ) : (
              shops.map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-4 py-3">{PLATFORM_LABEL[s.platform]}</td>
                  <td className="px-4 py-3">{s.brandName}</td>
                  <td className="px-4 py-3">{s.shopName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.maskedShopId}</td>
                  <td className="px-4 py-3">{STATUS_LABEL[s.status] ?? s.status}</td>
                  <td className="px-4 py-3">{formatDateTime(s.lastOrdersSyncedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-2">
        Shop được kết nối qua cơ chế ủy quyền OAuth chính thức của từng sàn; hệ thống chỉ đọc dữ
        liệu đơn hàng, sản phẩm của shop đã ủy quyền.
      </p>
    </div>
  );
}
