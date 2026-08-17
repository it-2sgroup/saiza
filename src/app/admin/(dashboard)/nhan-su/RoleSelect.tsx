"use client";

import { updateStaffRole } from "./actions";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import type { StaffRole } from "@/lib/supabase/profile";

const ROLES: StaffRole[] = ["admin", "editor", "contributor"];

export function RoleSelect({ id, role }: { id: string; role: StaffRole }) {
  return (
    <form action={updateStaffRole.bind(null, id)}>
      <select
        name="role"
        defaultValue={role}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="cursor-pointer rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink-2 outline-none transition-colors duration-300 ease-soft hover:border-ink"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
