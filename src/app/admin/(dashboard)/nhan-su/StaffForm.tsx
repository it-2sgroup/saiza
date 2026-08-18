"use client";

import { useActionState, useState } from "react";
import { inviteStaffAccount, type StaffFormState } from "./actions";
import { Combobox } from "../Combobox";

const initialState: StaffFormState = { error: null, success: false };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

const ROLE_OPTIONS = [
  { value: "admin", label: "Quản trị" },
  { value: "editor", label: "Biên tập viên" },
  { value: "contributor", label: "Cộng tác viên" },
];

export function StaffForm() {
  const [state, formAction, pending] = useActionState(inviteStaffAccount, initialState);
  const [role, setRole] = useState("contributor");

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
          options={ROLE_OPTIONS}
          onChange={setRole}
          buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
        />
      </div>
      <p className="text-sm text-ink-2">
        Nhân viên sẽ nhận email chứa đường dẫn để tự đặt mật khẩu và bắt đầu sử dụng khu quản trị.
      </p>
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
