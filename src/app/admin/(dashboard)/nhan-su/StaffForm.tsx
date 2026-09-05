"use client";

import { useActionState, useState } from "react";
import { inviteStaffAccount, type StaffFormState } from "./actions";
import { Combobox } from "../Combobox";
import { PeoplePicker } from "../lark/PeoplePicker";
import { Avatar } from "../Avatar";
import { useToastOnActionState } from "../useToastOnActionState";
import type { ConfigOption } from "@/lib/admin/configLists";
import type { RoleOption } from "@/lib/admin/roleCapabilities";
import type { StaffOption } from "../lark/StaffSharePicker";

const initialState: StaffFormState = { error: null, success: false };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function StaffForm({
  departments,
  roles,
  larkContacts,
}: {
  departments: ConfigOption[];
  roles: RoleOption[];
  larkContacts: StaffOption[];
}) {
  const [state, formAction, pending] = useActionState(
    inviteStaffAccount,
    initialState,
  );
  // Also refreshes the staff list below (router.refresh(), see
  // useToastOnActionState) — otherwise a newly invited person only shows up
  // there after a manual page reload, same bug the Lark tab had.
  useToastOnActionState(
    state,
    state.success ? "Đã gửi lời mời qua email." : null,
  );
  const departmentOptions = [
    { value: "", label: "Chưa gán — sẽ chọn khi tạo file" },
    ...departments.map((d) => ({
      value: d.code,
      label: `${d.code} — ${d.label}`,
    })),
  ];
  const roleOptions = roles.map((r) => ({ value: r.code, label: r.label }));
  const [role, setRole] = useState(
    roles.find((r) => !r.isSuperAdmin && !r.canManageStaff)?.code ??
      roles[0]?.code ??
      "",
  );
  const [department, setDepartment] = useState("");

  // Sourcing a new hire from the Lark org directory (pick, don't type) is
  // the fast path — picking a suggestion fills both fields at once. Typing
  // an email that isn't in `larkContacts` still works for someone not in
  // Lark yet; `full_name` just has to be typed in by hand in that case.
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [pickedFrom, setPickedFrom] = useState<StaffOption | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-xs tracking-[0.1em] text-ink-2 uppercase"
        >
          Chọn từ danh bạ Lark (hoặc nhập email)
        </label>
        {pickedFrom ? (
          <div className="flex items-center gap-2.5 rounded-[14px] border border-line bg-wash px-3.5 py-2.5">
            <Avatar
              fullName={pickedFrom.full_name}
              avatarUrl={pickedFrom.avatar_url}
              size={8}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[14px] font-medium text-ink">
                {pickedFrom.full_name}
              </span>
              <span className="truncate text-xs text-ink-2">
                {pickedFrom.email}
              </span>
            </div>
            <input type="hidden" name="email" value={email} />
            <button
              type="button"
              onClick={() => {
                setPickedFrom(null);
                setEmail("");
                setFullName("");
              }}
              className="flex-shrink-0 cursor-pointer text-xs font-semibold text-accent hover:text-ink"
            >
              Đổi
            </button>
          </div>
        ) : (
          <PeoplePicker
            staff={larkContacts}
            value={email}
            onChange={setEmail}
            onSelect={(s) => {
              setEmail(s.email);
              setFullName(s.full_name);
              setPickedFrom(s);
            }}
            name="email"
            placeholder="Nhập tên hoặc email để tìm trong Lark..."
            inputClassName={`${fieldClasses} w-full`}
          />
        )}
        {larkContacts.length === 0 && (
          <p className="text-xs text-ink-2">
            Chưa có danh bạ Lark để chọn — bấm &quot;Đồng bộ nhân viên
            Lark&quot; ở trang danh sách, hoặc nhập email thủ công ở trên.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="full_name"
          className="text-xs tracking-[0.1em] text-ink-2 uppercase"
        >
          Họ tên
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={fieldClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="role"
          className="text-xs tracking-[0.1em] text-ink-2 uppercase"
        >
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
        <label
          htmlFor="department"
          className="text-xs tracking-[0.1em] text-ink-2 uppercase"
        >
          Phòng ban
        </label>
        <Combobox
          name="department"
          value={department}
          options={departmentOptions}
          onChange={setDepartment}
          buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
        />
        <p className="text-xs text-ink-2">
          Dùng để tự điền mã phòng ban khi nhân viên tạo file Lark.
        </p>
      </div>
      <p className="text-sm text-ink-2">
        Nhân viên sẽ nhận email chứa đường dẫn để tự đặt mật khẩu và bắt đầu sử
        dụng khu quản trị.
      </p>
      {state.error && (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending || !email.trim() || !fullName.trim()}
        className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang gửi..." : "Gửi lời mời"}
      </button>
    </form>
  );
}
