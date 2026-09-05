"use client";

import { useActionState } from "react";
import { syncLarkContactsAction, type SyncContactsState } from "./actions";
import { useToastOnActionState } from "../useToastOnActionState";

const initialState: SyncContactsState = { error: null };

// Re-fetches every connected Lark app's contact directory live (bypassing
// the 30-minute cache) so someone who just joined/left the Lark org shows
// up (or disappears) from the "Thêm nhân viên" picker immediately, instead
// of whoever's still sitting in the last cached snapshot.
export function SyncLarkContactsButton() {
  const [state, formAction, pending] = useActionState(
    syncLarkContactsAction,
    initialState,
  );
  useToastOnActionState(
    state,
    state.count !== undefined
      ? `Đã đồng bộ ${state.count} người từ Lark.`
      : null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={pending ? "animate-spin" : ""}
        >
          <path d="M21 12a9 9 0 0 1-15.3 6.4L3 15" />
          <path d="M3 12a9 9 0 0 1 15.3-6.4L21 9" />
          <path d="M21 3v6h-6" />
          <path d="M3 21v-6h6" />
        </svg>
        {pending ? "Đang đồng bộ..." : "Đồng bộ nhân viên Lark"}
      </button>
    </form>
  );
}
