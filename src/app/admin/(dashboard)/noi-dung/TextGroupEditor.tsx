"use client";

import { useActionState, useState, useTransition } from "react";
import { saveTextGroup, resetTextGroup, type TextGroupFormState } from "./actions";

export type TextGroupField = { key: string; label: string; currentVi: string; currentEn: string };

const initialState: TextGroupFormState = { error: null, success: false };
const fieldClasses =
  "w-full rounded-[10px] border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function TextGroupEditor({
  groupKey,
  groupLabel,
  fields,
  isOverridden,
  defaultOpen,
}: {
  groupKey: string;
  groupLabel: string;
  fields: TextGroupField[];
  isOverridden: boolean;
  defaultOpen?: boolean;
}) {
  const keys = fields.map((f) => f.key);
  const [state, formAction, pending] = useActionState(saveTextGroup.bind(null, keys), initialState);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();

  return (
    <details
      open={defaultOpen}
      className="overflow-hidden rounded-card border border-line bg-card [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold transition-colors duration-300 ease-soft hover:bg-wash">
        <span>{groupLabel}</span>
        <span className="text-xs font-normal text-ink-2">
          {fields.length} mục{isOverridden ? " · đã tuỳ chỉnh" : ""}
        </span>
      </summary>
      <form action={formAction} className="flex flex-col gap-4 border-t border-line px-5 py-5">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label className="text-xs text-ink-2">{field.label}</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                name={`${field.key}__vi`}
                defaultValue={field.currentVi}
                placeholder="Tiếng Việt"
                className={fieldClasses}
              />
              <input
                name={`${field.key}__en`}
                defaultValue={field.currentEn}
                placeholder="English"
                className={fieldClasses}
              />
            </div>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
          {isOverridden && (
            <button
              type="button"
              disabled={isResetting}
              onClick={() => {
                setResetError(null);
                startReset(async () => {
                  const result = await resetTextGroup(groupKey);
                  if (result.error) setResetError(result.error);
                });
              }}
              className="cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isResetting ? "..." : "Khôi phục mặc định"}
            </button>
          )}
          {state.error && <span className="text-sm font-medium text-red-600">{state.error}</span>}
          {state.success && <span className="text-sm font-medium text-accent-2">Đã lưu.</span>}
          {resetError && <span className="text-sm font-medium text-red-600">{resetError}</span>}
        </div>
      </form>
    </details>
  );
}
