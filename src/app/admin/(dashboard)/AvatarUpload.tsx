"use client";

import { useActionState, useRef } from "react";
import { uploadAvatar, type AvatarUploadState } from "./actions";
import { getInitials } from "@/lib/admin/initials";

const initialState: AvatarUploadState = { error: null, avatarUrl: null };

type AvatarUploadProps = {
  fullName: string;
  avatarUrl: string | null;
  size?: "sm" | "lg";
};

const SIZE_CLASSES: Record<"sm" | "lg", { box: string; text: string; icon: number }> = {
  sm: { box: "h-9 w-9", text: "text-xs", icon: 14 },
  lg: { box: "h-16 w-16", text: "text-xl", icon: 20 },
};

export function AvatarUpload({ fullName, avatarUrl, size = "sm" }: AvatarUploadProps) {
  const [state, formAction, pending] = useActionState(uploadAvatar, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayUrl = state.avatarUrl ?? avatarUrl;
  const { box, text, icon } = SIZE_CLASSES[size];

  return (
    <form action={formAction} className="flex flex-shrink-0 flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        aria-label="Đổi ảnh đại diện"
        className={`group relative flex ${box} flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-accent text-white disabled:cursor-not-allowed`}
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, arbitrary host
          <img src={displayUrl} alt={fullName} className="h-full w-full object-cover" />
        ) : (
          <span className={`font-semibold ${text}`}>{getInitials(fullName)}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-all duration-300 ease-soft group-hover:bg-ink/55 group-hover:opacity-100">
          <svg
            width={icon}
            height={icon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        name="avatar"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      />
      {pending && <span className="text-[11px] text-ink-2">Đang tải lên...</span>}
      {state.error && <span className="max-w-[140px] text-[11px] font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
