"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "../Avatar";
import type { StaffOption } from "./StaffSharePicker";

type PanelRect = { top: number; left: number; width: number };

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
  const [rect, setRect] = useState<PanelRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const updateRect = () => {
      const r = rootRef.current!.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
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
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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
            role="listbox"
            style={{ position: "fixed", top: rect.top, left: rect.left, width: Math.max(rect.width, 260) }}
            className="z-[110] max-h-72 overflow-y-auto rounded-xl border border-line bg-card py-1.5 shadow-[0_20px_45px_rgba(22,33,62,0.18)]"
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
