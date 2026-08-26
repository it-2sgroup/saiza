"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/Button";
import { StaffForm } from "./StaffForm";

export function AddStaffModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <ActionButton variant="accent" onClick={() => setOpen(true)} className="px-6 py-3 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Thêm nhân viên
      </ActionButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[88vh] w-full max-w-[480px] animate-soft-in overflow-y-auto rounded-card bg-card p-6 shadow-[0_30px_60px_rgba(22,33,62,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Thêm nhân viên mới</h2>
                <p className="text-sm text-ink-2">Gửi lời mời qua email để họ tự tạo mật khẩu.</p>
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

            <StaffForm />
          </div>
        </div>
      )}
    </>
  );
}
