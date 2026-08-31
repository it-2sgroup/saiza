"use client";

import { useState, useTransition } from "react";
import { Modal, ModalHeader } from "../Modal";
import { browseLarkFolder } from "./actions";
import type { LarkDriveItem } from "@/lib/lark/client";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";

type Crumb = { token: string | null; name: string };

function FolderRowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

function fileTypeLabel(type: string) {
  return LARK_FILE_TYPE_LABELS[type as LarkFileType] ?? type;
}

export function DriveExplorer({ appKey, appLabel }: { appKey: string; appLabel: string }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<Crumb[]>([{ token: null, name: appLabel }]);
  const [items, setItems] = useState<LarkDriveItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = (token: string | null) => {
    startTransition(async () => {
      const res = await browseLarkFolder(token, appKey);
      if (res.error) {
        setError(res.error);
        setItems([]);
      } else {
        setError(null);
        setItems(res.items ?? []);
      }
    });
  };

  const openExplorer = () => {
    setPath([{ token: null, name: appLabel }]);
    setOpen(true);
    load(null);
  };

  const enterFolder = (item: LarkDriveItem) => {
    setPath((p) => [...p, { token: item.token, name: item.name }]);
    load(item.token);
  };

  const goToCrumb = (index: number) => {
    setPath((p) => p.slice(0, index + 1));
    load(path[index].token);
  };

  const folders = items.filter((i) => i.type === "folder");
  const files = items.filter((i) => i.type !== "folder");

  return (
    <>
      <button
        type="button"
        onClick={openExplorer}
        title="Duyệt Drive"
        aria-label="Duyệt Drive"
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
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
        </svg>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden p-6"
      >
        <ModalHeader
          title={`Duyệt Drive — ${appLabel}`}
          subtitle="Xem toàn bộ thư mục và file thật trong Lark, kể cả file có từ trước khi hệ thống này tồn tại."
          onClose={() => setOpen(false)}
        />

        <div className="mb-3 flex flex-shrink-0 flex-wrap items-center gap-1 text-sm">
          {path.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-ink-2">/</span>}
              <button
                type="button"
                onClick={() => goToCrumb(i)}
                disabled={i === path.length - 1}
                className={i === path.length - 1 ? "font-semibold text-ink" : "cursor-pointer text-accent hover:text-ink"}
              >
                {c.name}
              </button>
            </span>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {pending ? (
            <p className="text-sm text-ink-2">Đang tải...</p>
          ) : error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ink-2">Thư mục trống.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {folders.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Thư mục ({folders.length})</h3>
                  <div className="flex flex-col divide-y divide-line rounded-card border border-line">
                    {folders.map((f) => (
                      <button
                        key={f.token}
                        type="button"
                        onClick={() => enterFolder(f)}
                        className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left transition-colors duration-300 ease-soft hover:bg-wash"
                      >
                        <FolderRowIcon />
                        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{f.name}</span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="flex-shrink-0 text-ink-2"
                        >
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">File ({files.length})</h3>
                  <div className="flex flex-col divide-y divide-line rounded-card border border-line">
                    {files.map((f) => (
                      <div key={f.token} className="flex items-center justify-between gap-2.5 px-4 py-2.5">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-[14px] font-medium">{f.name}</span>
                          <span className="text-xs text-ink-2">{fileTypeLabel(f.type)}</span>
                        </div>
                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-shrink-0 text-xs font-medium text-accent hover:text-ink"
                          >
                            Mở →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
