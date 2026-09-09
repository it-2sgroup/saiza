"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ShareExistingDoc } from "./ShareExistingDoc";
import { MoveFileButton } from "./MoveFileButton";
import { TransferOwnerButton } from "./TransferOwnerButton";
import { DeleteLarkFileButton } from "./DeleteLarkFileButton";
import { useAnchoredPopover } from "../useAnchoredPopover";
import { Btn } from "../controls";
import type { StaffOption } from "./StaffSharePicker";
import type { LarkFileType } from "@/lib/lark/client";

type Action = "share" | "move" | "transfer" | "delete";

const MENU_WIDTH = 288;
// Sub-action forms (share/move/transfer) need more room than the plain menu
// list — an email input + permission dropdown + remove button don't fit
// comfortably in 288px.
const FORM_WIDTH = 360;

// One geometry for every row in the panel — same height, padding and radius
// whether the row is a link (Mở) or a button, so the list reads as one menu.
const MENU_ITEM_CLASS =
  "flex h-9 w-full cursor-pointer items-center rounded-lg px-3 text-left text-sm font-medium text-ink transition-colors duration-150 hover:bg-wash";

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

  const close = () => {
    setOpen(false);
    setAction(null);
  };

  // Render the menu in a portal anchored to the trigger's real screen
  // coordinates instead of `position: absolute` inside the card — the card
  // is narrower than the menu and clips/misplaces it otherwise.
  const panelWidth = action ? FORM_WIDTH : MENU_WIDTH;
  const { rootRef, panelRef, anchorRect, placement } = useAnchoredPopover(
    open,
    close,
  );
  const rect = anchorRect && {
    left: Math.min(
      Math.max(8, anchorRect.right - panelWidth),
      window.innerWidth - panelWidth - 8,
    ),
    top: placement === "top" ? undefined : anchorRect.bottom + 6,
    bottom:
      placement === "top" ? window.innerHeight - anchorRect.top + 6 : undefined,
  };

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <Btn
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((o) => !o)}
        aria-label="Tuỳ chọn"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </Btn>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-panel
            role="menu"
            style={{
              position: "fixed",
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              width: panelWidth,
            }}
            className="lark-theme z-[100] max-h-[80vh] overflow-y-auto rounded-xl border border-line bg-card p-2 shadow-[0_20px_45px_rgba(22,33,62,0.18)]"
          >
            {action === null ? (
              <div className="flex flex-col gap-0.5">
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={close}
                    className={MENU_ITEM_CLASS}
                  >
                    Mở trong Lark
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setAction("share")}
                  className={MENU_ITEM_CLASS}
                >
                  Chia sẻ
                </button>
                <button
                  type="button"
                  onClick={() => setAction("move")}
                  className={MENU_ITEM_CLASS}
                >
                  Di chuyển
                </button>
                <button
                  type="button"
                  onClick={() => setAction("transfer")}
                  className={MENU_ITEM_CLASS}
                >
                  Chuyển quyền sở hữu
                </button>
                <div className="my-1 border-t border-line" />
                <button
                  type="button"
                  onClick={() => setAction("delete")}
                  className="flex h-9 w-full cursor-pointer items-center rounded-lg px-3 text-left text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50"
                >
                  {fileType === "folder" ? "Xoá thư mục" : "Xoá file"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => setAction(null)}
                  className="w-fit"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  Quay lại
                </Btn>
                {action === "share" && (
                  <ShareExistingDoc
                    documentId={documentId}
                    fileType={fileType}
                    staff={staff}
                    embedded
                  />
                )}
                {action === "move" && (
                  <MoveFileButton
                    documentId={documentId}
                    fileType={fileType}
                    folderOptions={folderOptions}
                    embedded
                  />
                )}
                {action === "transfer" && (
                  <TransferOwnerButton
                    documentId={documentId}
                    fileType={fileType}
                    staff={staff}
                    embedded
                  />
                )}
                {action === "delete" && (
                  <DeleteLarkFileButton
                    documentId={documentId}
                    fileType={fileType}
                    embedded
                  />
                )}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
