"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "../Avatar";
import { useAnchoredPopover } from "../useAnchoredPopover";
import type { StaffOption } from "./StaffSharePicker";

// Free-text email input with a rich, searchable suggestion dropdown (avatar +
// name + email) instead of a native <datalist> — datalists can't render
// images, and their browser-native filtering is inconsistent. Typing an email
// that isn't in `staff` still works: this only feeds suggestions, it never
// restricts the final value (any real Lark account should keep working).
export function PeoplePicker({
  staff,
  value,
  onChange,
  name,
  placeholder = "Nhập tên hoặc email...",
  inputClassName,
}: {
  staff: StaffOption[];
  value: string;
  onChange: (email: string) => void;
  name?: string;
  placeholder?: string;
  inputClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const { rootRef, panelRef, anchorRect, placement } = useAnchoredPopover(open, () => setOpen(false));
  const rect = anchorRect && {
    left: anchorRect.left,
    width: anchorRect.width,
    top: placement === "top" ? undefined : anchorRect.bottom + 6,
    bottom: placement === "top" ? window.innerHeight - anchorRect.top + 6 : undefined,
  };

  const needle = value.trim().toLowerCase();
  const matches = (
    needle ? staff.filter((s) => s.full_name.toLowerCase().includes(needle) || s.email.toLowerCase().includes(needle)) : staff
  ).slice(0, 50);

  const pick = (s: StaffOption) => {
    onChange(s.email);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative flex-1">
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />

      {open &&
        rect &&
        matches.length > 0 &&
        createPortal(
          <div
            ref={panelRef}
            data-popover-panel
            role="listbox"
            style={{ position: "fixed", top: rect.top, bottom: rect.bottom, left: rect.left, width: Math.max(rect.width, 260) }}
            className="lark-theme z-[110] max-h-72 overflow-y-auto rounded-xl border border-line bg-card py-1.5 font-[family-name:var(--font-ibm-plex-sans)] shadow-[0_20px_45px_rgba(22,33,62,0.18)]"
          >
            {matches.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors duration-300 ease-soft hover:bg-wash"
              >
                <Avatar fullName={s.full_name} avatarUrl={s.avatar_url ?? null} size={7} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13.5px] font-medium">{s.full_name}</span>
                  <span className="truncate text-xs text-ink-2">{s.email}</span>
                </div>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
