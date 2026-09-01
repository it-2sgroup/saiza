"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShareExistingDoc } from "./ShareExistingDoc";
import { MoveFileButton } from "./MoveFileButton";
import { TransferOwnerButton } from "./TransferOwnerButton";
import { DeleteLarkFileButton } from "./DeleteLarkFileButton";
import type { StaffOption } from "./StaffSharePicker";
import type { LarkFileType } from "@/lib/lark/client";

type Action = "share" | "move" | "transfer" | "delete";
type PanelRect = { top: number; left: number };

const PANEL_WIDTH = 288;

const MENU_ITEM_CLASS =
  "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-ink transition-colors duration-300 ease-soft hover:bg-wash";

// Consolidates Mở/Chia sẻ/Di chuyển/Chuyển quyền sở hữu/Xoá — which used to
// be 4-5 separate buttons cluttering every row — into a single "..." menu.
// Sub-actions render the existing button components in `embedded` mode
// (form only, no own trigger) inside the same panel with a back button.
export function ItemActionsMenu({
  documentId,
  fileType,
  url,
  staff,
  folderOptions,
}: {
  documentId: string;
  fileType?: LarkFileType;
  url?: string | null;
  staff: StaffOption[];
  folderOptions: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [rect, setRect] = useState<PanelRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setAction(null);
  };

  // Render the menu in a portal anchored to the trigger's real screen
  // coordinates instead of `position: absolute` inside the card — the card
  // is narrower than the menu and clips/misplaces it otherwise.
  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const updateRect = () => {
      const r = rootRef.current!.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.right - PANEL_WIDTH), window.innerWidth - PANEL_WIDTH - 8);
      setRect({ top: r.bottom + 6, left });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Tuỳ chọn"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={{ position: "fixed", top: rect.top, left: rect.left, width: PANEL_WIDTH }}
            className="z-[100] rounded-xl border border-line bg-card p-2 shadow-[0_20px_45px_rgba(22,33,62,0.18)]"
          >
            {action === null ? (
              <div className="flex flex-col gap-0.5">
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" onClick={close} className={MENU_ITEM_CLASS}>
                    Mở trong Lark →
                  </a>
                )}
                <button type="button" onClick={() => setAction("share")} className={MENU_ITEM_CLASS}>
                  Chia sẻ thêm
                </button>
                <button type="button" onClick={() => setAction("move")} className={MENU_ITEM_CLASS}>
                  Di chuyển
                </button>
                <button type="button" onClick={() => setAction("transfer")} className={MENU_ITEM_CLASS}>
                  Chuyển quyền sở hữu
                </button>
                <div className="my-1 border-t border-line" />
                <button
                  type="button"
                  onClick={() => setAction("delete")}
                  className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-[13.5px] font-medium text-red-600 transition-colors duration-300 ease-soft hover:bg-red-50"
                >
                  Xoá file
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setAction(null)}
                  className="flex w-fit cursor-pointer items-center gap-1 text-xs font-medium text-ink-2 hover:text-ink"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Quay lại
                </button>
                {action === "share" && <ShareExistingDoc documentId={documentId} fileType={fileType} staff={staff} embedded />}
                {action === "move" && <MoveFileButton documentId={documentId} fileType={fileType} folderOptions={folderOptions} embedded />}
                {action === "transfer" && <TransferOwnerButton documentId={documentId} fileType={fileType} staff={staff} embedded />}
                {action === "delete" && <DeleteLarkFileButton documentId={documentId} fileType={fileType} embedded />}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
