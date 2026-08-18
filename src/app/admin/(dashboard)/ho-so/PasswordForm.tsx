"use client";

import { useActionState, useState } from "react";
import { changePassword, type ChangePasswordState } from "./actions";
import { validatePassword } from "@/lib/admin/password";

const initialState: ChangePasswordState = { error: null, success: false };
const fieldClasses =
  "w-64 rounded-[10px] border border-line bg-paper px-3 py-2 text-[14px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const [newPassword, setNewPassword] = useState("");
  const liveCheck = newPassword ? validatePassword(newPassword) : null;

  return (
    <form action={formAction} className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-line py-4">
        <label htmlFor="current_password" className="text-sm text-ink-2">
          Mật khẩu hiện tại
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClasses}
        />
      </div>
      <div className="flex items-start justify-between gap-4 border-b border-line py-4">
        <label htmlFor="new_password" className="pt-2 text-sm text-ink-2">
          Mật khẩu mới
        </label>
        <div className="flex w-64 flex-col gap-1.5">
          <input
            id="new_password"
            name="new_password"
            type="password"
            required
            minLength={10}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className={`${fieldClasses} w-full`}
          />
          <p className="text-xs text-ink-2">Ít nhất 10 ký tự, có chữ hoa, chữ thường và số.</p>
          {liveCheck && !liveCheck.valid && <p className="text-xs font-medium text-red-600">{liveCheck.error}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-b border-line py-4">
        <label htmlFor="confirm_password" className="text-sm text-ink-2">
          Nhập lại mật khẩu mới
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={fieldClasses}
        />
      </div>
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-0.5">
          {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
          {state.success && <p className="text-sm font-medium text-accent-2">Đã đổi mật khẩu.</p>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto w-fit cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang đổi..." : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
