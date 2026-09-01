"use client";

import { Combobox } from "../Combobox";
import { PeoplePicker } from "./PeoplePicker";
import type { ShareRow } from "@/lib/lark/shareRows";

export type StaffOption = { id: string; full_name: string; email: string; avatar_url: string | null };
export type { ShareRow };

const PERM_OPTIONS = [
  { value: "view", label: "Chỉ xem" },
  { value: "edit", label: "Được sửa" },
  { value: "full_access", label: "Toàn quyền" },
];

const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

// Reusable "share with colleagues" row list: emits its current value via a
// hidden JSON input under `hiddenFieldName` so a plain <form action> Server
// Action can read it, without needing per-row dynamic field names. Email is
// free text (any Lark account works, not just staff with a website login) —
// `staff` only feeds the autocomplete suggestions, it isn't the allowed set.
export function StaffSharePicker({
  staff,
  hiddenFieldName,
  value,
  onChange,
}: {
  staff: StaffOption[];
  hiddenFieldName: string;
  value: ShareRow[];
  onChange: (rows: ShareRow[]) => void;
}) {
  const updateRow = (index: number, patch: Partial<ShareRow>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const removeRow = (index: number) => onChange(value.filter((_, i) => i !== index));
  const addRow = () => onChange([...value, { email: "", perm: "view" }]);

  return (
    <div className="flex flex-col gap-2.5">
      <input type="hidden" name={hiddenFieldName} value={JSON.stringify(value)} />
      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <PeoplePicker
            staff={staff}
            value={row.email}
            onChange={(email) => updateRow(i, { email })}
            placeholder="Nhập tên hoặc email@2sgroup.vn"
            inputClassName={`${fieldClasses} w-full`}
          />
          <div className="w-36 flex-shrink-0">
            <Combobox
              value={row.perm}
              options={PERM_OPTIONS}
              onChange={(perm) => updateRow(i, { perm: perm as ShareRow["perm"] })}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Xoá người này"
            className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 hover:bg-wash hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="w-fit cursor-pointer text-sm font-semibold text-accent hover:text-ink">
        + Thêm người
      </button>
    </div>
  );
}
