"use client";

import { useState } from "react";
import { Pagination } from "../Pagination";
import { TypeBadge } from "./TypeBadge";
import { ItemActionsMenu } from "./ItemActionsMenu";
import type { StaffOption } from "./StaffSharePicker";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";

const PAGE_SIZE = 6;

export function RecentFilesList({
  rows,
  staff,
  folderOptions,
  creatorName,
}: {
  rows: { targetId: string; title: string; url: string | null; fileType: LarkFileType; createdAt: string; folderName: string | null }[];
  staff: StaffOption[];
  folderOptions: { value: string; label: string }[];
  creatorName: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  if (clampedPage !== page) setPage(clampedPage);
  const paged = rows.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  if (rows.length === 0) return <p className="text-sm text-ink-2">Chưa có tài liệu nào được tạo.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col divide-y divide-line">
        {paged.map((row) => (
          <div key={row.targetId} className="flex items-center gap-3 py-2.5">
            <TypeBadge type={row.fileType} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[14.5px] font-medium">{row.title}</span>
              <span className="text-xs text-ink-2">
                {LARK_FILE_TYPE_LABELS[row.fileType]} · {creatorName} · 📁 {row.folderName ?? "—"}
              </span>
            </div>
            <span className="flex-shrink-0 text-xs whitespace-nowrap text-ink-2">
              {new Date(row.createdAt).toLocaleDateString("vi-VN")}
            </span>
            <ItemActionsMenu documentId={row.targetId} fileType={row.fileType} url={row.url} staff={staff} folderOptions={folderOptions} />
          </div>
        ))}
      </div>
      <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
