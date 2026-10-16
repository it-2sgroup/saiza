"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProductSales } from "@/lib/admin/salesAnalytics";

function formatVnd(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}

export function SalesChart({ data }: { data: ProductSales[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-2">Chưa có dữ liệu để vẽ biểu đồ.</p>;
  }

  const chartData = data.slice(0, 8).map((p) => ({
    name: p.productName.length > 18 ? p.productName.slice(0, 18) + "…" : p.productName,
    fullName: p.productName,
    platform: p.platform,
    revenue: p.revenue,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}tr` : String(v))} />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => formatVnd(Number(value))}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""}
          />
          <Bar dataKey="revenue" fill="var(--color-accent, #ef4444)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
