"use client";

import { useActionState, useState, useTransition } from "react";
import { saveConfigGroup, resetConfigGroup, type ConfigGroupFormState } from "./actions";

export type ConfigGroupField = { key: string; label: string; placeholder?: string; currentValue: string };

const initialState: ConfigGroupFormState = { error: null, success: false };
const fieldClasses =
  "w-full rounded-[10px] border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function ConfigGroupEditor({
  groupKey,
  groupLabel,
  fields,
  isOverridden,
}: {
  groupKey: string;
  groupLabel: string;
  fields: ConfigGroupField[];
  isOverridden: boolean;
}) {
  const keys = fields.map((f) => f.key);
  const [state, formAction, pending] = useActionState(saveConfigGroup.bind(null, keys), initialState);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{groupLabel}</h2>
        {isOverridden && (
          <button
            type="button"
            disabled={isResetting}
            onClick={() => {
              setResetError(null);
              startReset(async () => {
                const result = await resetConfigGroup(groupKey);
                if (result.error) setResetError(result.error);
              });
            }}
            className="cursor-pointer rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResetting ? "..." : "Khôi phục mặc định"}
          </button>
        )}
      </div>
      <form action={formAction} className="flex flex-col gap-4">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <label htmlFor={field.key} className="text-xs text-ink-2">
              {field.label}
            </label>
            <input
              id={field.key}
              name={field.key}
              defaultValue={field.currentValue}
              placeholder={field.placeholder}
              className={fieldClasses}
            />
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
          {state.error && <span className="text-sm font-medium text-red-600">{state.error}</span>}
          {state.success && <span className="text-sm font-medium text-accent-2">Đã lưu.</span>}
          {resetError && <span className="text-sm font-medium text-red-600">{resetError}</span>}
        </div>
      </form>
    </div>
  );
}
