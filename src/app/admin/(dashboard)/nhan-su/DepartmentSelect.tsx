"use client";

import { useState, useTransition } from "react";
import { updateStaffDepartment } from "./actions";
import { DEPARTMENTS } from "@/lib/admin/departments";
import { Combobox } from "../Combobox";

const OPTIONS = [
  { value: "", label: "Chưa gán" },
  ...DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` })),
];

export function DepartmentSelect({ id, department }: { id: string; department: string | null }) {
  const [value, setValue] = useState(department ?? "");
  const [, startTransition] = useTransition();

  return (
    <Combobox
      value={value}
      options={OPTIONS}
      onChange={(next) => {
        setValue(next);
        const formData = new FormData();
        formData.set("department", next);
        startTransition(() => {
          updateStaffDepartment(id, formData);
        });
      }}
      buttonClassName="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink"
    />
  );
}
