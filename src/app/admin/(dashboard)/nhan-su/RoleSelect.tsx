"use client";

import { useState, useTransition } from "react";
import { updateStaffRole } from "./actions";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import type { StaffRole } from "@/lib/supabase/profile";
import { Combobox } from "../Combobox";

const ROLES: StaffRole[] = ["admin", "editor", "contributor"];
const OPTIONS = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

export function RoleSelect({ id, role }: { id: string; role: StaffRole }) {
  const [value, setValue] = useState<StaffRole>(role);
  const [, startTransition] = useTransition();

  return (
    <Combobox
      value={value}
      options={OPTIONS}
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
