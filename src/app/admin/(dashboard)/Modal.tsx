"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  children,
  panelClassName = "w-full max-w-[480px] p-6",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div
        className={`animate-soft-in rounded-card bg-card shadow-[0_30px_60px_rgba(22,33,62,0.35)] ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex flex-shrink-0 items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
