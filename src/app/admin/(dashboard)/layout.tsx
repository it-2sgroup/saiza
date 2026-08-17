import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, canViewInbox, ROLE_LABELS } from "@/lib/admin/permissions";
import { LogoutButton } from "./LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/tin-tuc", label: "Tin tức" },
  { href: "/admin/tuyen-dung", label: "Tuyển dụng" },
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
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-shrink-0 flex-col gap-1 border-r border-line bg-card p-5">
        <div className="mb-6 flex flex-col gap-0.5 px-1">
          <span className="text-lg font-semibold text-accent">SAIZA</span>
          <span className="text-xs text-ink-2">Khu quản trị</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
          {canViewInbox(profile.role) && (
            <Link
              href="/admin/lien-he"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-accent"
            >
              Hộp thư liên hệ
            </Link>
          )}
          {canManageStaff(profile.role) && (
            <Link
              href="/admin/nhan-su"
              className="rounded-full px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-accent"
            >
              Nhân sự
            </Link>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex flex-col gap-0.5 px-1">
            <span className="text-sm font-semibold">{profile.full_name}</span>
            <span className="text-xs text-ink-2">{ROLE_LABELS[profile.role]}</span>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
