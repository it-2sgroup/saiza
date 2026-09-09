"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { switchLarkApp } from "./actions";
import { useAnchoredPopover } from "../useAnchoredPopover";
import { Btn, labelClasses } from "../controls";

export function AppSwitcher({
  apps,
  activeKey,
}: {
  apps: { key: string; label: string }[];
  activeKey: string;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const { rootRef, panelRef, anchorRect, placement } = useAnchoredPopover(
    open,
    () => setOpen(false),
  );
  const rect = anchorRect && {
    left: anchorRect.left,
    width: Math.max(anchorRect.width, 260),
    top: placement === "top" ? undefined : anchorRect.bottom + 6,
    bottom:
      placement === "top" ? window.innerHeight - anchorRect.top + 6 : undefined,
  };

  if (apps.length <= 1) return null;

  const activeLabel = apps.find((a) => a.key === activeKey)?.label ?? activeKey;

  const pick = (key: string) => {
    setOpen(false);
    startTransition(() => switchLarkApp(key));
  };

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <Btn
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={pending ? "opacity-60" : ""}
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
          className={`flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Btn>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-panel
            role="listbox"
            style={{
              position: "fixed",
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              width: rect.width,
            }}
            className="lark-theme z-[110] rounded-xl border border-line bg-card p-1.5 shadow-[0_20px_45px_rgba(22,33,62,0.18)]"
          >
            <p className={`px-2.5 pt-1 pb-1.5 ${labelClasses}`}>Tổ chức</p>
            <div className="flex flex-col gap-0.5">
              {apps.map((a) => {
                const active = a.key === activeKey;
                return (
                  <button
                    key={a.key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(a.key)}
                    className={`flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-left text-sm font-medium transition-colors duration-150 ${
                      active
                        ? "bg-wash text-ink"
                        : "text-ink-2 hover:bg-wash hover:text-ink"
                    }`}
                  >
                    <span className="truncate">{a.label}</span>
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
