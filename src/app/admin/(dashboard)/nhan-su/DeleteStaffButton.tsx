"use client";

import { useActionState } from "react";
import { deleteStaffAccount, type DeleteStaffState } from "./actions";

const initialState: DeleteStaffState = { error: null };

export function DeleteStaffButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteStaffAccount.bind(null, id), initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Xoá tài khoản nhân viên này? Không thể hoàn tác.")) e.preventDefault();
      }}
      className="flex items-center gap-2"
    >
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-300 ease-soft hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "..." : "Xoá"}
      </button>
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
