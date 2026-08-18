"use client";

import { useActionState, useState } from "react";
import { deleteOwnAccount, type DeleteAccountState } from "./actions";

const initialState: DeleteAccountState = { error: null };

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(deleteOwnAccount, initialState);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!confirmOpen) {
    return (
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="w-fit cursor-pointer rounded-full border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 transition-colors duration-300 ease-soft hover:border-red-600"
      >
        Xoá tài khoản của tôi
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <p className="text-sm text-ink-2">
        Hành động này không thể hoàn tác. Nhập <span className="font-semibold text-ink">XOA TAI KHOAN</span> để xác
        nhận.
      </p>
      <input
        name="confirm_text"
        required
        placeholder="XOA TAI KHOAN"
        autoComplete="off"
        className="rounded-[14px] border border-red-200 bg-paper px-4 py-3 text-[15px] outline-none transition-all duration-300 ease-soft focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600/20"
      />
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <div className="flex gap-2.5">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang xoá..." : "Xác nhận xoá"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(false)}
          className="cursor-pointer rounded-full border border-line px-6 py-3 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}
