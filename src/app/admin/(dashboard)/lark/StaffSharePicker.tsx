"use client";

import { Combobox } from "../Combobox";
import { PeoplePicker } from "./PeoplePicker";
import { Btn, inputClasses } from "../controls";
import type { ShareRow } from "@/lib/lark/shareRows";

export type StaffOption = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  // Both set only by Nhân sự's "add from Lark" picker, where the same
  // person can legitimately appear once per org they belong to. orgLabel is
  // the small tag shown so those rows read as "same person, different org"
  // instead of a glitch; orgKey (the LARK_APPS key, e.g. "sismo") is what
  // the invite form uses to seed the new account's default Lark app — a
  // person picked from SISMO's directory needs "sismo" active by default,
  // or files they create land in whatever app happens to be first in
  // LARK_APPS, sharing to their own email fails (that email isn't a member
  // of that unrelated tenant), and they open the file in their real Lark
  // account to find they have no access to it at all.
  orgLabel?: string;
  orgKey?: string;
};
export type { ShareRow };

const PERM_OPTIONS = [
  { value: "view", label: "Chỉ xem" },
  { value: "edit", label: "Được sửa" },
  { value: "full_access", label: "Toàn quyền" },
];

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
  const removeRow = (index: number) =>
    onChange(value.filter((_, i) => i !== index));
  const addRow = () => onChange([...value, { email: "", perm: "view" }]);

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="hidden"
        name={hiddenFieldName}
        value={JSON.stringify(value)}
      />
      {value.map((row, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <PeoplePicker
            staff={staff}
            value={row.email}
            onChange={(email) => updateRow(i, { email })}
            placeholder="Nhập tên hoặc email@2sgroup.vn"
            inputClassName={inputClasses}
          />
          <div className="w-36 flex-shrink-0">
            <Combobox
              value={row.perm}
              options={PERM_OPTIONS}
              onChange={(perm) =>
                updateRow(i, { perm: perm as ShareRow["perm"] })
              }
              buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
            />
          </div>
          <Btn
            variant="ghost"
            size="icon-md"
            onClick={() => removeRow(i)}
            aria-label="Xoá người này"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </Btn>
        </div>
      ))}
      <Btn variant="ghost" size="sm" onClick={addRow} className="w-fit">
        + Thêm người
      </Btn>
    </div>
  );
}
