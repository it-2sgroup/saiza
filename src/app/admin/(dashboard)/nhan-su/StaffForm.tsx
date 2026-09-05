"use client";

import { useActionState, useState } from "react";
import { inviteStaffAccount, type StaffFormState } from "./actions";
import { Combobox } from "../Combobox";
import type { ConfigOption } from "@/lib/admin/configLists";
import type { RoleOption } from "@/lib/admin/roleCapabilities";

const initialState: StaffFormState = { error: null, success: false };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function StaffForm({ departments, roles }: { departments: ConfigOption[]; roles: RoleOption[] }) {
  const [state, formAction, pending] = useActionState(inviteStaffAccount, initialState);
  const departmentOptions = [
    { value: "", label: "Chưa gán — sẽ chọn khi tạo file" },
    ...departments.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` })),
  ];
  const roleOptions = roles.map((r) => ({ value: r.code, label: r.label }));
  const [role, setRole] = useState(roles.find((r) => !r.isSuperAdmin && !r.canManageStaff)?.code ?? roles[0]?.code ?? "");
  const [department, setDepartment] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="full_name" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Họ tên
        </label>
        <input id="full_name" name="full_name" required className={fieldClasses} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Email
        </label>
        <input id="email" name="email" type="email" required className={fieldClasses} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="role" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Vai trò
        </label>
        <Combobox
          name="role"
          value={role}
          options={roleOptions}
          onChange={setRole}
          buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="department" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Phòng ban
        </label>
        <Combobox
          name="department"
          value={department}
          options={departmentOptions}
          onChange={setDepartment}
          buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
        />
        <p className="text-xs text-ink-2">Dùng để tự điền mã phòng ban khi nhân viên tạo file Lark.</p>
      </div>
      <p className="text-sm text-ink-2">Nhân viên sẽ nhận email chứa đường dẫn để tự đặt mật khẩu và bắt đầu sử dụng khu quản trị.</p>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-accent-2">Đã gửi lời mời qua email.</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang gửi..." : "Gửi lời mời"}
      </button>
    </form>
  );
}
