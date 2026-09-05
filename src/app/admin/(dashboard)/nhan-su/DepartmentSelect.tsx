"use client";

import { useState, useTransition } from "react";
import { updateStaffDepartment } from "./actions";
import type { ConfigOption } from "@/lib/admin/configLists";
import { Combobox } from "../Combobox";

export function DepartmentSelect({ id, department, departments }: { id: string; department: string | null; departments: ConfigOption[] }) {
  const [value, setValue] = useState(department ?? "");
  const [, startTransition] = useTransition();
  const options = [{ value: "", label: "Chưa gán" }, ...departments.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` }))];

  return (
    <Combobox
      value={value}
      options={options}
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
