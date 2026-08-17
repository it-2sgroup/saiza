"use client";

import { updateSubmissionStatus } from "./actions";
import type { ContactStatus } from "@/lib/admin/types";

const OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "new", label: "Mới" },
  { value: "contacted", label: "Đã liên hệ" },
  { value: "archived", label: "Lưu trữ" },
];

export function StatusSelect({ id, status }: { id: string; status: ContactStatus }) {
  return (
    <form action={updateSubmissionStatus.bind(null, id)}>
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="cursor-pointer rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink-2 outline-none transition-colors duration-300 ease-soft hover:border-ink"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
