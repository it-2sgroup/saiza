"use client";

import { useState, useTransition } from "react";
import { updateStaffRole } from "./actions";
import type { StaffRole } from "@/lib/supabase/profile";
import type { RoleOption } from "@/lib/admin/roleCapabilities";
import { Combobox } from "../Combobox";

export function RoleSelect({ id, role, roles }: { id: string; role: StaffRole; roles: RoleOption[] }) {
  const [value, setValue] = useState<StaffRole>(role);
  const [, startTransition] = useTransition();
  const options = roles.map((r) => ({ value: r.code, label: r.label }));

  return (
    <Combobox
      value={value}
      options={options}
      onChange={(next) => {
        setValue(next as StaffRole);
        const formData = new FormData();
        formData.set("role", next);
        startTransition(() => {
          updateStaffRole(id, formData);
        });
      }}
      buttonClassName="flex items-center gap-2 rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink"
    />
  );
}
