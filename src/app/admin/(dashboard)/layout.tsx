import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, canViewInbox } from "@/lib/admin/permissions";
import { LogoutButton } from "./LogoutButton";
import { SettingsModal } from "./SettingsModal";

const ICONS = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  news: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </>
  ),
  jobs: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  inbox: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </>
  ),
  staff: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
} as const;

function NavIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: "overview" as const },
  { href: "/admin/tin-tuc", label: "Tin tức", icon: "news" as const },
  { href: "/admin/tuyen-dung", label: "Tuyển dụng", icon: "jobs" as const },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div className="flex max-w-[420px] flex-col gap-3">
          <h1 className="text-xl font-semibold">Tài khoản chưa được cấp quyền</h1>
          <p className="text-ink-2">
            Bạn đã đăng nhập nhưng chưa có hồ sơ nhân viên trong hệ thống. Liên hệ quản trị viên để được cấp quyền
            truy cập.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex h-full w-64 flex-shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-card p-5">
        <div className="mb-6 flex flex-col gap-0.5 px-1">
          <span className="text-lg font-semibold text-accent">SAIZA</span>
          <span className="text-xs text-ink-2">Khu quản trị</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-accent"
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
          {canViewInbox(profile.role) && (
            <Link
              href="/admin/lien-he"
              className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-accent"
            >
              <NavIcon name="inbox" />
              Hộp thư liên hệ
            </Link>
          )}
          {canManageStaff(profile.role) && (
            <Link
              href="/admin/nhan-su"
              className="flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-accent"
            >
              <NavIcon name="staff" />
              Nhân sự
            </Link>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
          <SettingsModal profile={profile} />
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
