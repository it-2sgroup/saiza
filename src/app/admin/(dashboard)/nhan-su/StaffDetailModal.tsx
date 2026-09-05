"use client";

import { Avatar } from "../Avatar";
import { Modal } from "../Modal";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { resolveConfigLabel, type ConfigOption } from "@/lib/admin/configListHelpers";
import type { StaffRole } from "@/lib/supabase/profile";
import { RoleSelect } from "./RoleSelect";
import { DepartmentSelect } from "./DepartmentSelect";
import { DeleteStaffButton } from "./DeleteStaffButton";

export type StaffPerson = {
  id: string;
  full_name: string;
  role: StaffRole;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function StaffDetailModal({
  person,
  email,
  pendingInvite,
  onClose,
  departments,
}: {
  person: StaffPerson;
  email: string;
  pendingInvite: boolean;
  onClose: () => void;
  departments: ConfigOption[];
}) {
  return (
    <Modal open onClose={onClose} panelClassName="w-full max-w-[440px] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Avatar fullName={person.full_name} avatarUrl={person.avatar_url} size={11} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-semibold">{person.full_name}</span>
            <span className="text-xs text-ink-2">{email}</span>
            {pendingInvite && (
              <span className="mt-0.5 flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                Chờ kích hoạt
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-2">Vai trò</span>
          <RoleSelect id={person.id} role={person.role} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-2">Phòng ban</span>
          <DepartmentSelect id={person.id} department={person.department} departments={departments} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-2">Tham gia</span>
          <span className="text-sm text-ink">{new Date(person.created_at).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50/50 px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-red-700">Xoá tài khoản</span>
          <span className="text-xs text-red-700/70">
            Hiện tại: {ROLE_LABELS[person.role]} · {resolveConfigLabel(person.department, departments) ?? "chưa gán phòng ban"}
          </span>
        </div>
        <DeleteStaffButton id={person.id} />
      </div>
    </Modal>
  );
}
