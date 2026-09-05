"use client";

import { useState } from "react";
import { Avatar } from "../Avatar";
import { resolveConfigLabel, type ConfigOption } from "@/lib/admin/configListHelpers";
import { resolveRole, resolveRoleLabel, type RoleOption } from "@/lib/admin/roleCapabilities";
import { StaffDetailModal, type StaffPerson } from "./StaffDetailModal";

// Custom roles have no fixed set of keys to map colors from, so this picks
// by capability tier instead of by exact role code: super-admin stands out,
// staff-management roles get a distinct color, everything else is neutral.
function roleBadgeClass(role: RoleOption): string {
  if (role.isSuperAdmin) return "bg-accent/10 text-accent";
  if (role.canManageStaff) return "bg-blue-100 text-blue-700";
  return "bg-wash text-ink-2";
}

export function StaffRow({
  person,
  email,
  isSelf,
  pendingInvite,
  departments,
  roles,
}: {
  person: StaffPerson;
  email: string;
  isSelf: boolean;
  pendingInvite: boolean;
  departments: ConfigOption[];
  roles: RoleOption[];
}) {
  const role = resolveRole(person.role, roles);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => !isSelf && setOpen(true)}
        disabled={isSelf}
        className={`flex w-full items-center justify-between gap-4 rounded-card border border-line bg-card p-4 text-left transition-colors duration-300 ease-soft ${
          isSelf ? "cursor-default" : "cursor-pointer hover:border-ink"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar fullName={person.full_name} avatarUrl={person.avatar_url} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2 truncate text-[15px] font-semibold">
              {person.full_name}
              {isSelf && <span className="text-xs font-normal text-ink-2">(bạn)</span>}
            </span>
            <span className="truncate text-xs text-ink-2">{email}</span>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          {pendingInvite && (
            <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:inline-block">
              Chờ kích hoạt
            </span>
          )}
          <span className="hidden text-xs text-ink-2 sm:inline-block">
            {resolveConfigLabel(person.department, departments) ?? "Chưa gán phòng ban"}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(role)}`}>
            {resolveRoleLabel(person.role, roles) ?? person.role}
          </span>
          {!isSelf && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-ink-2"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          )}
        </div>
      </button>

      {open && (
        <StaffDetailModal
          person={person}
          email={email}
          pendingInvite={pendingInvite}
          onClose={() => setOpen(false)}
          departments={departments}
          roles={roles}
        />
      )}
    </>
  );
}
