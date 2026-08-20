"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { uploadSiteImage, resetSiteImage, type SiteImageUploadState } from "./actions";

const initialState: SiteImageUploadState = { error: null, success: false };

export function SiteImageCard({
  itemKey,
  label,
  currentUrl,
  isOverridden,
}: {
  itemKey: string;
  label: string;
  currentUrl: string;
  isOverridden: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadSiteImage.bind(null, itemKey), initialState);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-card border border-line bg-card p-4">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-wash">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external/Storage host */}
        <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
      </div>
      <span className="truncate text-sm font-medium" title={label}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex-1 cursor-pointer rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang tải lên..." : "Đổi ảnh"}
        </button>
        {isOverridden && (
          <button
            type="button"
            disabled={isResetting}
            onClick={() => {
              setResetError(null);
              startReset(async () => {
                const result = await resetSiteImage(itemKey);
                if (result.error) setResetError(result.error);
              });
            }}
            title="Khôi phục ảnh mặc định"
            className="cursor-pointer rounded-full border border-line px-3 py-2 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResetting ? "..." : "Khôi phục"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      />
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
      {resetError && <span className="text-xs font-medium text-red-600">{resetError}</span>}
    </form>
  );
}
