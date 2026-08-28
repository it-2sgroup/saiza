"use client";

import { useMemo, useState } from "react";
import { Modal, ModalHeader } from "../Modal";
import { ShareExistingDoc } from "./ShareExistingDoc";
import { DeleteLarkFileButton } from "./DeleteLarkFileButton";
import { MoveFileButton } from "./MoveFileButton";
import { TransferOwnerButton } from "./TransferOwnerButton";
import type { StaffOption } from "./StaffSharePicker";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";

export type HistoryRow = {
  targetId: string;
  title: string;
  url: string | null;
  fileType: LarkFileType;
  createdAt: string;
};

export function HistoryModal({
  rows,
  staff,
  folderOptions,
}: {
  rows: HistoryRow[];
  staff: StaffOption[];
  folderOptions: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(needle));
  }, [rows, q]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Lịch sử tạo file của tôi"
        aria-label="Lịch sử tạo file của tôi"
        className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
      >
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
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden p-6"
      >
        <ModalHeader title="Lịch sử tạo file của bạn" subtitle={`${rows.length} file (chưa xoá).`} onClose={() => setOpen(false)} />

        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên file..."
          className="mb-3 flex-shrink-0 rounded-full border border-line bg-paper px-4 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-2">{q ? `Không tìm thấy file khớp với "${q}".` : "Bạn chưa tạo file nào."}</p>
          ) : (
            <div className="flex flex-col divide-y divide-line">
              {filtered.map((row) => (
                <div key={row.targetId} className="flex flex-col gap-2 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-[14.5px] font-medium">{row.title}</span>
                      <span className="text-xs text-ink-2">
                        {LARK_FILE_TYPE_LABELS[row.fileType]} · {new Date(row.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    {row.url && (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 text-sm font-medium text-accent hover:text-ink"
                      >
                        Mở →
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <ShareExistingDoc documentId={row.targetId} fileType={row.fileType} staff={staff} />
                      <MoveFileButton documentId={row.targetId} fileType={row.fileType} folderOptions={folderOptions} />
                      <TransferOwnerButton documentId={row.targetId} fileType={row.fileType} staff={staff} />
                    </div>
                    <DeleteLarkFileButton documentId={row.targetId} fileType={row.fileType} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
