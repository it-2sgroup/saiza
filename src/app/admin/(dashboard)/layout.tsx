import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, canPublish, canViewInbox } from "@/lib/admin/permissions";
import { Sidebar } from "./Sidebar";
import { ToastProvider } from "./ToastProvider";
import type { NavItem } from "./NavLinks";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: "overview" },
  { href: "/admin/tin-tuc", label: "Tin tức", icon: "news" },
  { href: "/admin/tuyen-dung", label: "Tuyển dụng", icon: "jobs" },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: "products" },
  { href: "/admin/lark", label: "Tạo file Lark", icon: "lark" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div className="flex max-w-[420px] flex-col gap-3">
          <h1 className="text-xl font-semibold">Tài khoản chưa được cấp quyền</h1>
          <p className="text-ink-2">
            Bạn đã đăng nhập nhưng chưa có hồ sơ nhân viên trong hệ thống. Liên hệ quản trị viên để được cấp quyền truy cập.
          </p>
        </div>
      </div>
    );
  }

  const navItems: NavItem[] = [
    ...NAV_ITEMS,
    ...(canPublish(profile.role)
      ? ([
          { href: "/admin/hinh-anh", label: "Hình ảnh", icon: "images" },
          { href: "/admin/noi-dung", label: "Nội dung", icon: "text" },
          { href: "/admin/lien-ket", label: "Liên hệ & Liên kết", icon: "link" },
        ] satisfies NavItem[])
      : []),
    ...(canViewInbox(profile.role) ? ([{ href: "/admin/lien-he", label: "Hộp thư liên hệ", icon: "inbox" }] satisfies NavItem[]) : []),
    ...(canManageStaff(profile.role) ? ([{ href: "/admin/nhan-su", label: "Nhân sự", icon: "staff" }] satisfies NavItem[]) : []),
    ...(canManageStaff(profile.role) ? ([{ href: "/admin/danh-muc", label: "Danh mục", icon: "tags" }] satisfies NavItem[]) : []),
  ];

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar profile={profile} items={navItems} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
