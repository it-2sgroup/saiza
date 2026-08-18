"use client";

import { useActionState } from "react";
import { updateFullName, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = { error: null, success: false };
const fieldClasses =
  "w-64 rounded-[10px] border border-line bg-paper px-3 py-2 text-[14px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function ProfileForm({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(updateFullName, initialState);

  return (
    <form action={formAction} className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-line py-4">
        <label htmlFor="full_name" className="text-sm text-ink-2">
          Họ tên
        </label>
        <input id="full_name" name="full_name" defaultValue={fullName} required className={fieldClasses} />
      </div>
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-0.5">
          {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
          {state.success && <p className="text-sm font-medium text-accent-2">Đã lưu.</p>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto w-fit cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
