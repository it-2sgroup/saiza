"use client";

import { useActionState, useRef } from "react";
import { createLarkDocument, type LarkDocFormState } from "./actions";

const initialState: LarkDocFormState = { error: null };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function LarkDocForm() {
  const [state, formAction, pending] = useActionState(createLarkDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex max-w-[560px] flex-col gap-4">
      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Tiêu đề tài liệu
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="Ví dụ: Biên bản họp 25/08"
            className={fieldClasses}
          />
        </div>
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang tạo..." : "Tạo tài liệu Lark"}
        </button>
      </form>

      {state.url && (
        <div className="flex flex-col gap-1.5 rounded-card border border-line bg-card p-5">
          <span className="text-sm font-semibold">Đã tạo &quot;{state.title}&quot;</span>
          <a href={state.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline break-all">
            {state.url}
          </a>
        </div>
      )}
    </div>
  );
}
