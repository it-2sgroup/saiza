"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPopover } from "./useAnchoredPopover";

type Option = { value: string; label: string };

type ComboboxProps = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  name?: string;
  buttonClassName?: string;
  panelClassName?: string;
};

export function Combobox({ value, options, onChange, name, buttonClassName, panelClassName }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  // Position the portaled panel from the trigger's real screen coordinates
  // instead of relying on `position: absolute` inside whatever scroll
  // container happens to wrap this Combobox (e.g. a modal) — that let the
  // panel's overflow force the modal itself to grow a second scrollbar.
  const { rootRef, panelRef, anchorRect, placement } = useAnchoredPopover(open, () => setOpen(false));
  const selected = options.find((o) => o.value === value);
  const rect = anchorRect && {
    left: anchorRect.left,
    width: anchorRect.width,
    top: placement === "top" ? undefined : anchorRect.bottom + 6,
    bottom: placement === "top" ? window.innerHeight - anchorRect.top + 6 : undefined,
  };

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} className={buttonClassName}>
        <span className="truncate">{selected?.label ?? ""}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform duration-300 ease-soft ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
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
            className={
              panelClassName ??
              "z-[110] max-h-72 min-w-[160px] overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-[0_16px_32px_rgba(22,33,62,0.18)]"
            }
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ease-soft ${
                  o.value === value ? "bg-accent text-white" : "text-ink hover:bg-wash"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
