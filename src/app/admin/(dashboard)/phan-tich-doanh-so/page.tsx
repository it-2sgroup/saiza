import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewSalesAnalytics } from "@/lib/admin/permissions";
import { getSalesSummary } from "@/lib/admin/salesAnalytics";
import { SalesChart } from "./SalesChart";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}

const PLATFORM_LABEL: Record<string, string> = {
  shopee: "Shopee",
  tiktok: "TikTok Shop",
};

export default async function SalesAnalyticsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canViewSalesAnalytics(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const summary = await getSalesSummary(30);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Phân tích doanh số</h1>
        <p className="text-sm text-ink-2">
          Dữ liệu đơn hàng thực tế từ TikTok Shop và Shopee — {summary.windowDays} ngày gần nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-line bg-card p-5">
          <div className="text-xs font-semibold text-ink-2">Tổng doanh thu</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{formatVnd(summary.totalRevenue)}</div>
        </div>
        <div className="rounded-card border border-line bg-card p-5">
          <div className="text-xs font-semibold text-ink-2">Tổng số đơn (có doanh thu)</div>
          <div className="mt-1 text-2xl font-semibold text-ink">{summary.totalOrders.toLocaleString("vi-VN")}</div>
        </div>
        <div className="rounded-card border border-line bg-card p-5">
          <div className="text-xs font-semibold text-ink-2">Theo sàn</div>
          <div className="mt-1 flex flex-col gap-0.5 text-sm">
            {summary.byPlatform.map((p) => (
              <span key={p.platform}>
                {PLATFORM_LABEL[p.platform]}: {formatVnd(p.revenue)} ({p.orders.toLocaleString("vi-VN")} đơn)
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-card border border-line bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Top sản phẩm theo doanh thu</h2>
        <SalesChart data={summary.topProducts} />
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-wash text-xs font-semibold text-ink-2">
            <tr>
              <th className="px-4 py-3">Sàn</th>
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Sản phẩm</th>
              <th className="px-4 py-3 text-right">Số lượng</th>
              <th className="px-4 py-3 text-right">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {summary.topProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-2">
                  Chưa có dữ liệu trong khoảng thời gian này.
                </td>
              </tr>
            ) : (
              summary.topProducts.map((p, i) => (
                <tr key={`${p.platform}-${p.shopName}-${p.productName}-${i}`} className="border-t border-line">
                  <td className="px-4 py-3">{PLATFORM_LABEL[p.platform]}</td>
                  <td className="px-4 py-3">{p.shopName}</td>
                  <td className="max-w-[320px] truncate px-4 py-3" title={p.productName}>
                    {p.productName}
                  </td>
                  <td className="px-4 py-3 text-right">{p.quantity.toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-right">{formatVnd(p.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
