"use client";

import { useMemo, useState } from "react";
import { Modal, ModalHeader } from "../Modal";
import { Pagination } from "../Pagination";
import { ItemActionsMenu } from "./ItemActionsMenu";
import { departmentLabel } from "@/lib/admin/departments";
import type { StaffOption } from "./StaffSharePicker";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";

export type HistoryRow = {
  targetId: string;
  title: string;
  url: string | null;
  fileType: LarkFileType;
  createdAt: string;
  folderName: string | null;
};

const TYPE_FILTERS: { value: LarkFileType | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  ...(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[]).map((t) => ({ value: t, label: LARK_FILE_TYPE_LABELS[t] })),
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mới nhất" },
  { value: "name", label: "Tên A → Z" },
] as const;

const PAGE_SIZE = 10;

export function HistoryModal({
  rows,
  staff,
  folderOptions,
  trigger,
  inline = false,
  creatorName,
  creatorDepartment = null,
}: {
  rows: HistoryRow[];
  staff: StaffOption[];
  folderOptions: { value: string; label: string }[];
  trigger?: React.ReactNode;
  inline?: boolean;
  creatorName?: string;
  creatorDepartment?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<LarkFileType | "">("");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("recent");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const result = rows.filter((r) => {
      if (needle && !r.title.toLowerCase().includes(needle)) return false;
      if (typeFilter && r.fileType !== typeFilter) return false;
      return true;
    });
    if (sort === "name") return [...result].sort((a, b) => a.title.localeCompare(b.title, "vi"));
    return result;
  }, [rows, q, typeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp instead of always resetting to 1 on filter change — only forces
  // the page down when it's now out of range, so narrowing then widening a
  // filter doesn't jump the user back to the first page unnecessarily.
  const clampedPage = Math.min(page, totalPages);
  if (clampedPage !== page) setPage(clampedPage);
  const paged = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  const historyIcon = (
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );

  const content = (
    <div className={inline ? "flex flex-col gap-3" : "flex min-h-0 flex-1 flex-col gap-3"}>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên file..."
          className="min-w-[180px] flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 ease-soft ${
                typeFilter === f.value ? "border-accent bg-accent text-white" : "border-line text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as (typeof SORT_OPTIONS)[number]["value"])}
          className="ml-auto rounded-full border border-line bg-paper px-3.5 py-2 text-xs font-medium text-ink outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className={inline ? "flex flex-col gap-3" : "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"}>
        {filtered.length === 0 ? (
          <p className="text-sm text-ink-2">{q || typeFilter ? "Không tìm thấy file khớp bộ lọc." : "Bạn chưa tạo file nào."}</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-line">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-paper text-left text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">
                  <th className="px-4 py-2.5">Tên file</th>
                  <th className="px-4 py-2.5">Loại</th>
                  <th className="px-4 py-2.5">Thư mục</th>
                  <th className="px-4 py-2.5">Phòng ban</th>
                  <th className="px-4 py-2.5">Người tạo</th>
                  <th className="px-4 py-2.5">Cập nhật</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {paged.map((row) => (
                  <tr key={row.targetId} className="transition-colors duration-300 ease-soft hover:bg-wash">
                    <td className="max-w-[280px] truncate px-4 py-2.5 font-medium">{row.title}</td>
                    <td className="px-4 py-2.5 text-ink-2">{LARK_FILE_TYPE_LABELS[row.fileType]}</td>
                    <td className="max-w-[160px] truncate px-4 py-2.5 text-ink-2">{row.folderName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-ink-2">{departmentLabel(creatorDepartment) ?? "(chưa gán)"}</td>
                    <td className="px-4 py-2.5 text-ink-2">{creatorName ?? "—"}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-ink-2">{new Date(row.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="px-2 py-2.5 text-right">
                      <ItemActionsMenu
                        documentId={row.targetId}
                        fileType={row.fileType}
                        url={row.url}
                        staff={staff}
                        folderOptions={folderOptions}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} />
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Lịch sử tạo file của tôi"
          aria-label="Lịch sử tạo file của tôi"
          className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {historyIcon}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden p-6"
      >
        <ModalHeader title="Lịch sử tạo file của bạn" subtitle={`${rows.length} file (chưa xoá).`} onClose={() => setOpen(false)} />
        {content}
      </Modal>
    </>
  );
}
