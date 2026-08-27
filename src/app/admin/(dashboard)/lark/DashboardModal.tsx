"use client";

import { useEffect, useState } from "react";
import { departmentLabel } from "@/lib/admin/departments";

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
  leaderboard: CreatorStat[];
  neverCreated: { id: string; fullName: string; department: string | null }[];
};

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-card border border-line bg-paper p-4">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-ink-2">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-2/70">{sub}</div>}
    </div>
  );
}

export function DashboardModal({ data }: { data: DashboardData }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const adoptionPct = data.totalStaff > 0 ? Math.round((data.activeCreators / data.totalStaff) * 100) : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Dashboard sử dụng"
        aria-label="Dashboard sử dụng"
        className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <rect x="7" y="12" width="3" height="6" rx="0.5" />
          <rect x="13" y="8" width="3" height="10" rx="0.5" />
          <rect x="18" y="5" width="3" height="13" rx="0.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="flex max-h-[88vh] w-full max-w-[780px] animate-soft-in flex-col overflow-hidden rounded-card bg-card p-6 shadow-[0_30px_60px_rgba(22,33,62,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Dashboard sử dụng — Lark</h2>
                <p className="text-sm text-ink-2">Mức độ nhân viên dùng hệ thống tạo file, chỉ Admin xem được.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Tổng nhân viên" value={data.totalStaff} />
                <StatTile
                  label="Đã dùng hệ thống"
                  value={`${data.activeCreators}/${data.totalStaff}`}
                  sub={`${adoptionPct}%`}
                />
                <StatTile label="Tổng file đã tạo" value={data.totalFiles} />
                <StatTile label="File trong 7 ngày qua" value={data.filesLast7Days} sub={`30 ngày: ${data.filesLast30Days}`} />
              </div>

              <div className="mb-5 flex flex-col gap-2.5">
                <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">
                  Xếp hạng theo số file đã tạo
                </h3>
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
                        <span className="flex-shrink-0 rounded-full bg-wash px-3 py-1 text-sm font-semibold text-ink">
                          {c.count} file
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">
                  Chưa từng tạo file ({data.neverCreated.length})
                </h3>
                {data.neverCreated.length === 0 ? (
                  <p className="text-sm text-ink-2">Mọi nhân viên đều đã dùng hệ thống — tốt lắm!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {data.neverCreated.map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink-2"
                      >
                        {p.fullName}
                        {p.department && <span className="text-ink-2/60"> · {departmentLabel(p.department)}</span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
