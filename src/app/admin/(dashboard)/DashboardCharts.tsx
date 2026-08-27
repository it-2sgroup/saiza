"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = {
  draft: "#C7D2FE",
  published: "#6366F1",
  open: "#6366F1",
  closed: "#94A3B8",
  new: "#F88AAF",
  contacted: "#6366F1",
  archived: "#C7D2FE",
  admin: "#1E1B4B",
  editor: "#6366F1",
  contributor: "#818CF8",
} as const;

type DashboardChartsProps = {
  news: { draft: number; published: number };
  jobs: { draft: number; open: number; closed: number };
  contacts?: { new: number; contacted: number; archived: number; trend: { date: string; count: number }[] };
  staff?: { admin: number; editor: number; contributor: number };
};

function DonutCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-card p-6">
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="h-[160px] w-[160px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2} strokeWidth={0}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                <span className="text-ink-2">{d.name}</span>
                <span className="font-semibold tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TrendCard({ trend }: { trend: { date: string; count: number }[] }) {
  const hasData = trend.some((t) => t.count > 0);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-card p-6 lg:col-span-2">
      <h3 className="text-[15px] font-semibold">Liên hệ 14 ngày qua</h3>
      {!hasData ? (
        <p className="text-sm text-ink-2">Chưa có yêu cầu liên hệ nào gần đây.</p>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="contactTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,33,62,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d.slice(5).replace("-", "/")}
                tick={{ fontSize: 12, fill: "#4A5B78" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#4A5B78" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip labelFormatter={(d) => `Ngày ${d}`} formatter={(value) => [value, "Lượt liên hệ"] as [number, string]} />
              <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fill="url(#contactTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function DashboardCharts({ news, jobs, contacts, staff }: DashboardChartsProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutCard
          title="Tin tức theo trạng thái"
          data={[
            { name: "Nháp", value: news.draft, color: COLORS.draft },
            { name: "Đã xuất bản", value: news.published, color: COLORS.published },
          ]}
        />
        <DonutCard
          title="Tuyển dụng theo trạng thái"
          data={[
            { name: "Nháp", value: jobs.draft, color: COLORS.draft },
            { name: "Đang tuyển", value: jobs.open, color: COLORS.open },
            { name: "Đã đóng", value: jobs.closed, color: COLORS.closed },
          ]}
        />
        {staff && (
          <DonutCard
            title="Nhân sự theo vai trò"
            data={[
              { name: "Quản trị", value: staff.admin, color: COLORS.admin },
              { name: "Biên tập viên", value: staff.editor, color: COLORS.editor },
              { name: "Cộng tác viên", value: staff.contributor, color: COLORS.contributor },
            ]}
          />
        )}
        {contacts && (
          <>
            <DonutCard
              title="Liên hệ theo trạng thái"
              data={[
                { name: "Mới", value: contacts.new, color: COLORS.new },
                { name: "Đã liên hệ", value: contacts.contacted, color: COLORS.contacted },
                { name: "Lưu trữ", value: contacts.archived, color: COLORS.archived },
              ]}
            />
            <TrendCard trend={contacts.trend} />
          </>
        )}
      </div>
    </div>
  );
}
