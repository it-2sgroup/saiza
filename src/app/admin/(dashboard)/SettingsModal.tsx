"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/supabase/profile";
import { ROLE_LABELS } from "@/lib/admin/permissions";
import { Avatar } from "./Avatar";
import { AvatarUpload } from "./AvatarUpload";
import { ProfileForm } from "./ho-so/ProfileForm";
import { PasswordForm } from "./ho-so/PasswordForm";
import { DeleteAccountForm } from "./ho-so/DeleteAccountForm";

type SectionId = "profile" | "password" | "danger";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "profile", label: "Hồ sơ" },
  { id: "password", label: "Bảo mật" },
  { id: "danger", label: "Vùng nguy hiểm" },
];

const SECTION_ICONS: Record<SectionId, React.ReactNode> = {
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </>
  ),
  password: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  danger: (
    <>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M4 7h16" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M19 7l-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7" />
    </>
  ),
};

function SectionIcon({ id }: { id: SectionId }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      {SECTION_ICONS[id]}
    </svg>
  );
}

export function SettingsModal({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionId>("profile");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSection("profile");
          setOpen(true);
        }}
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-2 text-left transition-colors duration-300 ease-soft hover:bg-wash"
      >
        <Avatar fullName={profile.full_name} avatarUrl={profile.avatar_url} size={9} />
        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
          <span className="truncate text-sm font-semibold">{profile.full_name}</span>
          <span className="text-xs text-ink-2">{ROLE_LABELS[profile.role]}</span>
        </div>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-ink-2"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="flex h-[min(600px,88vh)] w-full max-w-[860px] overflow-hidden rounded-card bg-card shadow-[0_30px_60px_rgba(22,33,62,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-52 flex-shrink-0 flex-col gap-1 border-r border-line bg-paper p-4">
              <span className="mb-2 px-3 text-xs font-semibold tracking-[0.08em] text-ink-2 uppercase">Cài đặt</span>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSection(s.id)}
                  className={`flex items-center gap-2.5 rounded-full px-3 py-2.5 text-left text-sm font-medium transition-colors duration-300 ease-soft ${
                    section === s.id ? "bg-wash text-accent" : "text-ink-2 hover:bg-wash"
                  }`}
                >
                  <SectionIcon id={s.id} />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 overflow-y-auto p-8">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="absolute top-5 right-5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>

              {section === "profile" && (
                <div className="max-w-[520px]">
                  <h2 className="mb-4 text-lg font-semibold">Hồ sơ</h2>
                  <div className="flex items-center justify-between gap-4 border-b border-line py-4">
                    <span className="text-sm text-ink-2">Ảnh đại diện</span>
                    <AvatarUpload fullName={profile.full_name} avatarUrl={profile.avatar_url} size="sm" />
                  </div>
                  <ProfileForm fullName={profile.full_name} />
                </div>
              )}
              {section === "password" && (
                <div className="max-w-[520px]">
                  <h2 className="mb-4 text-lg font-semibold">Bảo mật</h2>
                  <PasswordForm />
                </div>
              )}
              {section === "danger" && (
                <div className="max-w-[520px]">
                  <h2 className="mb-2 text-lg font-semibold text-red-600">Vùng nguy hiểm</h2>
                  <p className="mb-4 text-sm text-ink-2">
                    Xoá tài khoản sẽ gỡ quyền truy cập khu quản trị vĩnh viễn. Các bài viết bạn đã đăng vẫn được giữ lại.
                  </p>
                  <DeleteAccountForm />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
