"use client";

import { useState } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  resolveConfigLabel,
  type ConfigOption,
} from "@/lib/admin/configListHelpers";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import { Modal, ModalHeader } from "../Modal";
import { Btn, btnClasses, cardClasses } from "../controls";
import { StatTile } from "../StatTile";
import { ADOPTION_COLORS } from "./chartColors";

const TYPE_COLORS: Record<LarkFileType, string> = {
  docx: "#0B84D8",
  sheet: "#2E9E5B",
  bitable: "#8B5CF6",
  folder: "#D89B0B",
};

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
  staleWip: {
    targetId: string;
    title: string;
    url: string | null;
    creatorName: string;
    createdAt: string;
  }[];
};

export function DonutCard({
  title,
  data,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  // Recharts v3's Pie/Cell no longer reliably applies per-segment fill (the
  // color prop is silently dropped, rendering every slice black) — a plain
  // CSS conic-gradient ring sidesteps the library bug entirely.
  const segments = data
    .filter((d) => d.value > 0)
    .reduce<{ start: number; end: number; color: string }[]>((acc, d) => {
      const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
      return [
        ...acc,
        { start, end: start + (d.value / total) * 100, color: d.color },
      ];
    }, []);
  const stops = segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");
  return (
    <div className={`flex flex-col gap-3 ${cardClasses} p-4`}>
      <h3 className="text-[13px] font-semibold text-ink-2">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div
            className="relative h-[110px] w-[110px] flex-shrink-0 rounded-full"
            style={{ background: `conic-gradient(${stops})` }}
          >
            {/* Punches the ring's hole — must match the card background. */}
            <div className="absolute inset-5 rounded-full bg-card" />
          </div>
          <div className="flex flex-col gap-1.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: d.color }}
                />
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
    <div className={`flex flex-col gap-3 ${cardClasses} p-4`}>
      <h3 className="text-[13px] font-semibold text-ink-2">
        File tạo — 14 ngày qua
      </h3>
      {!hasData ? (
        <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>
      ) : (
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="larkTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B84D8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0B84D8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(22,33,62,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d.slice(5).replace("-", "/")}
                tick={{ fontSize: 12, fill: "#4A5B78" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#4A5B78" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                labelFormatter={(d) => `Ngày ${d}`}
                formatter={(value) => [value, "File"] as [number, string]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0B84D8"
                strokeWidth={2.5}
                fill="url(#larkTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function DashboardModal({
  data,
  trigger,
  inline = false,
  departments,
}: {
  data: DashboardData;
  trigger?: React.ReactNode;
  inline?: boolean;
  departments: ConfigOption[];
}) {
  const [open, setOpen] = useState(false);

  const adoptionPct =
    data.totalStaff > 0
      ? Math.round((data.activeCreators / data.totalStaff) * 100)
      : 0;

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

  const content = (
    <div className={inline ? "" : "min-h-0 flex-1 overflow-y-auto"}>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Tổng nhân viên" value={data.totalStaff} />
        <StatTile
          label="Đã dùng hệ thống"
          value={`${data.activeCreators}/${data.totalStaff}`}
          sub={`${adoptionPct}%`}
        />
        <StatTile label="Tổng file" value={data.totalFiles} />
        <StatTile
          label="File 7 ngày qua"
          value={data.filesLast7Days}
          sub={`30 ngày: ${data.filesLast30Days}`}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DonutCard
          title="Mức độ sử dụng"
          data={[
            {
              name: "Đã tạo file",
              value: data.activeCreators,
              color: ADOPTION_COLORS.active,
            },
            {
              name: "Chưa tạo file",
              value: data.totalStaff - data.activeCreators,
              color: ADOPTION_COLORS.inactive,
            },
          ]}
        />
        <DonutCard
          title="File theo loại"
          data={(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[])
            .filter((t) => (data.byType[t] ?? 0) > 0)
            .map((t) => ({
              name: LARK_FILE_TYPE_LABELS[t],
              value: data.byType[t],
              color: TYPE_COLORS[t],
            }))}
        />
      </div>

      <div className="mb-5">
        <TrendCard trend={data.trend} />
      </div>

      <div className="mb-5 flex flex-col gap-2.5">
        <h3 className="text-[13px] font-semibold text-ink-2">Xếp hạng</h3>
        {data.leaderboard.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có ai tạo file.</p>
        ) : (
          <div className={`flex flex-col divide-y divide-line ${cardClasses}`}>
            {data.leaderboard.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="w-5 flex-shrink-0 text-right text-xs font-semibold text-ink-2">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">
                      {c.fullName}
                    </span>
                    <span className="truncate text-xs text-ink-2">
                      {resolveConfigLabel(c.department, departments) ?? "—"} ·{" "}
                      {new Date(c.lastCreatedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                {/* Numeric count badge — one of the few places rounded-full
                    still belongs. */}
                <span className="flex-shrink-0 rounded-full bg-wash px-3 py-1 text-sm font-semibold tabular-nums text-ink">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-2.5">
        <h3 className="text-[13px] font-semibold text-ink-2">
          Chưa từng tạo file ({data.neverCreated.length})
        </h3>
        {data.neverCreated.length === 0 ? (
          <p className="text-sm text-ink-2">
            Tất cả nhân viên đều đã tạo file.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.neverCreated.map((p) => (
              <span
                key={p.id}
                className="rounded-lg border border-line bg-paper px-2.5 py-1 text-[13px] text-ink-2"
              >
                {p.fullName}
                {p.department && (
                  <span className="text-ink-2/60">
                    {" "}
                    · {resolveConfigLabel(p.department, departments)}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h3 className="text-[13px] font-semibold text-ink-2">
          WIP quá 30 ngày ({data.staleWip.length})
        </h3>
        {data.staleWip.length === 0 ? (
          <p className="text-sm text-ink-2">Không có.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-xl border border-amber-200 bg-amber-50/40">
            {data.staleWip.map((w) => (
              <div
                key={w.targetId}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {w.title}
                  </span>
                  <span className="truncate text-xs text-ink-2">
                    {w.creatorName} ·{" "}
                    {new Date(w.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {w.url && (
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noreferrer"
                    className={btnClasses("secondary", "sm")}
                  >
                    Mở
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <>
      {trigger ? (
        <span className="contents" onClick={() => setOpen(true)}>
          {trigger}
        </span>
      ) : (
        <Btn
          size="icon-md"
          onClick={() => setOpen(true)}
          title="Dashboard sử dụng"
          aria-label="Dashboard sử dụng"
        >
          {dashboardIcon}
        </Btn>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden p-6"
      >
        <ModalHeader
          title="Dashboard sử dụng — Lark"
          subtitle="Chỉ Admin xem được."
          onClose={() => setOpen(false)}
        />
        {content}
      </Modal>
    </>
  );
}
