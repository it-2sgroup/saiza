"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NamingSettingsPanel } from "./NamingSettingsPanel";
import type { LarkPrefs } from "@/lib/lark/prefs";
import type { ConfigOption } from "@/lib/admin/configLists";

export function LarkSettingsModal({
  prefs,
  department = null,
  trigger,
  open: controlledOpen,
  onOpenChange,
  departments,
  orgCodes,
  docTypes,
}: {
  prefs: LarkPrefs;
  department?: string | null;
  trigger?: React.ReactNode;
  // Controlled mode: caller owns the open state and renders no trigger here —
  // needed when the "open" button must live inside a <form> elsewhere (e.g.
  // LarkDocForm) but this drawer's own <form> must not be a descendant of it.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  departments: ConfigOption[];
  orgCodes: ConfigOption[];
  docTypes: ConfigOption[];
}) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => (isControlled ? onOpenChange?.(v) : setInternalOpen(v));

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOpen is a stable local wrapper, not a dep source of truth
  }, [open]);

  const settingsIcon = (
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );

  return (
    <>
      {isControlled ? null : trigger ? (
        <span className="contents" onClick={() => setOpen(true)}>
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 flex-shrink-0 cursor-pointer items-center gap-2 rounded-[9px] border border-line bg-card px-4 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {settingsIcon}
          Quy ước tên
        </button>
      )}

      {open &&
        createPortal(
          <div className="lark-theme animate-drawer-fade fixed inset-0 z-[100] flex justify-end bg-ink/40" onClick={() => setOpen(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-drawer-slide flex h-full w-full max-w-[420px] flex-col bg-card shadow-[-24px_0_60px_rgba(9,9,11,0.2)] font-[family-name:var(--font-ibm-plex-sans)]"
            >
              <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-line p-5">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-[15px] font-semibold text-ink">Quy ước đặt tên</h2>
                  <p className="text-[12.5px] text-ink-2">Áp dụng cho mọi file mới — vẫn sửa được từng lần.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <NamingSettingsPanel
                  prefs={prefs}
                  department={department}
                  departments={departments}
                  orgCodes={orgCodes}
                  docTypes={docTypes}
                  footer={(pending) => (
                    <div className="flex flex-shrink-0 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex-1 cursor-pointer rounded-[9px] border border-line py-2.5 text-[13px] font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={pending}
                        className="flex-1 cursor-pointer rounded-[9px] bg-accent py-2.5 text-[13px] font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pending ? "Đang lưu..." : "Lưu quy ước"}
                      </button>
                    </div>
                  )}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
