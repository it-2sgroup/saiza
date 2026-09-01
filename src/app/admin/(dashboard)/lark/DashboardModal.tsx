"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { departmentLabel } from "@/lib/admin/departments";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import { Modal, ModalHeader } from "../Modal";
import { StatTile } from "../StatTile";

const TYPE_COLORS: Record<LarkFileType, string> = {
  docx: "#0B84D8",
  sheet: "#2E9E5B",
  bitable: "#8B5CF6",
  folder: "#D89B0B",
};
const ADOPTION_COLORS = { active: "#0B84D8", inactive: "#B9C4D9" } as const;

export type CreatorStat = {
  id: string;
  fullName: string;
  department: string | null;
  count: number;
  lastCreatedAt: string;
};

export type DashboardData = {
  totalStaff: number;
  activeCreators: number;
  totalFiles: number;
  filesLast7Days: number;
  filesLast30Days: number;
  byType: Record<LarkFileType, number>;
  trend: { date: string; count: number }[];
  leaderboard: CreatorStat[];
  neverCreated: { id: string; fullName: string; department: string | null }[];
  staleWip: { targetId: string; title: string; url: string | null; creatorName: string; createdAt: string }[];
};

function DonutCard({ title, data }: { title: string; data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-paper p-4">
      <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-[110px] w-[110px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={32} outerRadius={50} paddingAngle={2} strokeWidth={0}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: d.color }} />
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
    <div className="flex flex-col gap-3 rounded-card border border-line bg-paper p-4">
      <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">File tạo — 14 ngày qua</h3>
      {!hasData ? (
        <p className="text-sm text-ink-2">Chưa có file nào trong 14 ngày qua.</p>
      ) : (
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="larkTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B84D8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0B84D8" stopOpacity={0} />
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
              <Tooltip labelFormatter={(d) => `Ngày ${d}`} formatter={(value) => [value, "File"] as [number, string]} />
              <Area type="monotone" dataKey="count" stroke="#0B84D8" strokeWidth={2.5} fill="url(#larkTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function DashboardModal({ data, trigger }: { data: DashboardData; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const adoptionPct = data.totalStaff > 0 ? Math.round((data.activeCreators / data.totalStaff) * 100) : 0;

  const dashboardIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="3" height="6" rx="0.5" />
      <rect x="13" y="8" width="3" height="10" rx="0.5" />
      <rect x="18" y="5" width="3" height="13" rx="0.5" />
    </svg>
  );

  return (
    <>
      {trigger ? (
        <span className="contents" onClick={() => setOpen(true)}>
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Dashboard sử dụng"
          aria-label="Dashboard sử dụng"
          className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {dashboardIcon}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden p-6"
      >
        <ModalHeader
          title="Dashboard sử dụng — Lark"
          subtitle="Mức độ nhân viên dùng hệ thống tạo file, chỉ Admin xem được."
          onClose={() => setOpen(false)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Tổng nhân viên" value={data.totalStaff} />
            <StatTile label="Đã dùng hệ thống" value={`${data.activeCreators}/${data.totalStaff}`} sub={`${adoptionPct}%`} />
            <StatTile label="Tổng file đã tạo" value={data.totalFiles} />
            <StatTile label="File trong 7 ngày qua" value={data.filesLast7Days} sub={`30 ngày: ${data.filesLast30Days}`} />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DonutCard
              title="Mức độ sử dụng"
              data={[
                { name: "Đã tạo file", value: data.activeCreators, color: ADOPTION_COLORS.active },
                { name: "Chưa tạo file", value: data.totalStaff - data.activeCreators, color: ADOPTION_COLORS.inactive },
              ]}
            />
            <DonutCard
              title="File theo loại"
              data={(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[])
                .filter((t) => (data.byType[t] ?? 0) > 0)
                .map((t) => ({ name: LARK_FILE_TYPE_LABELS[t], value: data.byType[t], color: TYPE_COLORS[t] }))}
            />
          </div>

          <div className="mb-5">
            <TrendCard trend={data.trend} />
          </div>

          <div className="mb-5 flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Xếp hạng theo số file đã tạo</h3>
            {data.leaderboard.length === 0 ? (
              <p className="text-sm text-ink-2">Chưa có ai tạo file.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-card">
                {data.leaderboard.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-5 flex-shrink-0 text-right text-xs font-semibold text-ink-2">{i + 1}</span>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[14.5px] font-medium">{c.fullName}</span>
                        <span className="text-xs text-ink-2">
                          {departmentLabel(c.department) ?? "chưa gán phòng ban"} · gần nhất{" "}
                          {new Date(c.lastCreatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 rounded-full bg-wash px-3 py-1 text-sm font-semibold text-ink">{c.count} file</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-5 flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">
              Chưa từng tạo file ({data.neverCreated.length})
            </h3>
            {data.neverCreated.length === 0 ? (
              <p className="text-sm text-ink-2">Mọi nhân viên đều đã dùng hệ thống — tốt lắm!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.neverCreated.map((p) => (
                  <span key={p.id} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink-2">
                    {p.fullName}
                    {p.department && <span className="text-ink-2/60"> · {departmentLabel(p.department)}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">
              WIP quá hạn — hơn 30 ngày ({data.staleWip.length})
            </h3>
            {data.staleWip.length === 0 ? (
              <p className="text-sm text-ink-2">Không có file WIP nào tồn đọng quá 30 ngày.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line rounded-card border border-amber-200 bg-amber-50/40">
                {data.staleWip.map((w) => (
                  <div key={w.targetId} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[14px] font-medium">{w.title}</span>
                      <span className="text-xs text-ink-2">
                        {w.creatorName} · tạo {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {w.url && (
                      <a
                        href={w.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 text-sm font-medium text-accent hover:text-ink"
                      >
                        Mở →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
