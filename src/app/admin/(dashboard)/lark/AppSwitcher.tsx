"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { switchLarkApp } from "./actions";
import { useAnchoredPopover } from "../useAnchoredPopover";

export function AppSwitcher({ apps, activeKey }: { apps: { key: string; label: string }[]; activeKey: string }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { rootRef, panelRef, anchorRect, placement } = useAnchoredPopover(open, () => setOpen(false));
  const rect = anchorRect && {
    left: anchorRect.left,
    width: Math.max(anchorRect.width, 260),
    top: placement === "top" ? undefined : anchorRect.bottom + 6,
    bottom: placement === "top" ? window.innerHeight - anchorRect.top + 6 : undefined,
  };

  if (apps.length <= 1) return null;

  const activeLabel = apps.find((a) => a.key === activeKey)?.label ?? activeKey;

  const pick = (key: string) => {
    setOpen(false);
    startTransition(() => switchLarkApp(key));
  };

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink ${pending ? "opacity-60" : ""}`}
      >
        {activeLabel}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ease-soft ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-panel
            role="listbox"
            style={{ position: "fixed", top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width }}
            className="lark-theme z-[110] overflow-hidden rounded-xl border border-line bg-card py-1.5 font-[family-name:var(--font-ibm-plex-sans)] shadow-[0_20px_45px_rgba(22,33,62,0.18)]"
          >
            <p className="px-3.5 pt-1 pb-2 text-[10.5px] font-semibold tracking-[0.08em] text-ink-2 uppercase">Chuyển tổ chức</p>
            <div className="flex flex-col">
              {apps.map((a) => {
                const active = a.key === activeKey;
                return (
                  <button
                    key={a.key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(a.key)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[14px] font-medium transition-colors duration-300 ease-soft ${
                      active ? "bg-wash text-ink" : "text-ink-2 hover:bg-wash hover:text-ink"
                    }`}
                  >
                    {a.label}
                    {active && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="flex-shrink-0 text-accent"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
