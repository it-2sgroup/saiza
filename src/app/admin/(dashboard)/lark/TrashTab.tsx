"use client";

import { useState } from "react";
import { Pagination } from "../Pagination";
import { TypeBadge, fileTypeLabel } from "./TypeBadge";
import { TrashRowActions } from "./TrashRowActions";
import type { TrashUiRow } from "./data";

const PAGE_SIZE = 10;
const RETENTION_DAYS = 30;

function daysLeft(purgeAt: string): number {
  const ms = new Date(purgeAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function TrashTab({ rows }: { rows: TrashUiRow[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  if (clampedPage !== page) setPage(clampedPage);
  const paged = rows.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-2">
        Các file/thư mục đã xoá được giữ lại tối đa {RETENTION_DAYS} ngày trước khi xoá vĩnh viễn khỏi Lark — trong thời gian đó bạn có thể
        khôi phục lại vị trí cũ.
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-2">Thùng rác trống.</p>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-line rounded-card border border-line">
            {paged.map((row) => {
              const left = daysLeft(row.purgeAt);
              return (
                <div key={row.documentId} className="flex items-center gap-3 px-4 py-2.5">
                  <TypeBadge type={row.fileType} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[14.5px] font-medium">{row.title}</span>
                    <span className="text-xs text-ink-2">
                      {fileTypeLabel(row.fileType)} · {row.deletedByName} · từ 📁 {row.originalFolderName} ·{" "}
                      {new Date(row.deletedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                      left <= 3 ? "bg-red-50 text-red-600" : "bg-wash text-ink-2"
                    }`}
                  >
                    {left === 0 ? "Xoá vĩnh viễn hôm nay" : `Còn ${left} ngày`}
                  </span>
                  <TrashRowActions documentId={row.documentId} canManage={row.canManage} />
                </div>
              );
            })}
          </div>
          <Pagination page={clampedPage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
