"use client";

import { useMemo, useState } from "react";
import { Modal, ModalHeader } from "../Modal";
import { ItemActionsMenu } from "./ItemActionsMenu";
import type { StaffOption } from "./StaffSharePicker";
import { DEPARTMENTS, departmentLabel } from "@/lib/admin/departments";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";

export type OverviewRow = {
  targetId: string;
  title: string;
  url: string | null;
  fileType: LarkFileType;
  createdAt: string;
  creatorName: string;
  creatorDepartment: string | null;
};

export function OverviewModal({
  rows,
  folderOptions,
  staff = [],
  renderTrigger,
}: {
  rows: OverviewRow[];
  folderOptions: { value: string; label: string }[];
  staff?: StaffOption[];
  renderTrigger?: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState("");
  const [fileType, setFileType] = useState<LarkFileType | "">("");

  const byType = useMemo(() => {
    const m = new Map<LarkFileType, number>();
    for (const r of rows) m.set(r.fileType, (m.get(r.fileType) ?? 0) + 1);
    return m;
  }, [rows]);

  const byDepartment = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const dept = r.creatorDepartment || "(chưa gán)";
      m.set(dept, (m.get(dept) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && !r.title.toLowerCase().includes(needle)) return false;
      if (department && r.creatorDepartment !== department) return false;
      if (fileType && r.fileType !== fileType) return false;
      return true;
    });
  }, [rows, q, department, fileType]);

  const overviewIcon = (
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
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Tổng quan toàn công ty"
          aria-label="Tổng quan toàn công ty"
          className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {overviewIcon}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[860px] flex-col overflow-hidden p-6"
      >
        <ModalHeader
          title="Tổng quan file Lark — toàn công ty"
          subtitle={`${rows.length} file (chưa xoá) · thuộc dung lượng lưu trữ của tổ chức 2SGROUP.`}
          onClose={() => setOpen(false)}
        />

        <div className="mb-4 grid flex-shrink-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-paper p-4">
            <h3 className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Theo loại file</h3>
            <div className="flex flex-col gap-1.5">
              {(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[])
                .filter((t) => (byType.get(t) ?? 0) > 0)
                .map((t) => (
                  <div key={t} className="flex items-center justify-between text-sm">
                    <span className="text-ink-2">{LARK_FILE_TYPE_LABELS[t]}</span>
                    <span className="font-medium">{byType.get(t)}</span>
                  </div>
                ))}
              {byType.size === 0 && <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>}
            </div>
          </div>
          <div className="rounded-card border border-line bg-paper p-4">
            <h3 className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Theo phòng ban</h3>
            <div className="flex flex-col gap-1.5">
              {byDepartment.map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between text-sm">
                  <span className="text-ink-2">{departmentLabel(dept) ?? dept}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {byDepartment.length === 0 && <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>}
            </div>
          </div>
        </div>

        <div className="mb-3 flex flex-shrink-0 flex-wrap gap-2.5">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên file..."
            className="min-w-[180px] flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-full border border-line bg-paper px-4 py-2.5 text-[14.5px] text-ink outline-none"
          >
            <option value="">Tất cả phòng ban</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.code} value={d.code}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as LarkFileType | "")}
            className="rounded-full border border-line bg-paper px-4 py-2.5 text-[14.5px] text-ink outline-none"
          >
            <option value="">Tất cả loại file</option>
            {(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[]).map((t) => (
              <option key={t} value={t}>
                {LARK_FILE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2 flex-shrink-0 text-sm text-ink-2">{filtered.length} kết quả</div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-2">Không có file khớp bộ lọc.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {filtered.map((row) => (
                <div key={row.targetId} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[14.5px] font-medium">{row.title}</span>
                    <span className="text-xs text-ink-2">
                      {LARK_FILE_TYPE_LABELS[row.fileType]} · {row.creatorName} ·{" "}
                      {departmentLabel(row.creatorDepartment) ?? "chưa gán phòng ban"} · {new Date(row.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <ItemActionsMenu
                    documentId={row.targetId}
                    fileType={row.fileType}
                    url={row.url}
                    staff={staff}
                    folderOptions={folderOptions}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
