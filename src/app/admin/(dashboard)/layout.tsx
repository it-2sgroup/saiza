import { getCurrentProfile } from "@/lib/supabase/profile";
import {
  canAccessLark,
  canManageStaff,
  canPublish,
  canViewInbox,
} from "@/lib/admin/permissions";
import { getRoles, resolveRole } from "@/lib/admin/roles";
import { Sidebar } from "./Sidebar";
import { ToastProvider } from "./ToastProvider";
import type { NavItem } from "./NavLinks";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-center">
        <div className="flex max-w-[420px] flex-col gap-3">
          <h1 className="text-xl font-semibold">
            Tài khoản chưa được cấp quyền
          </h1>
          <p className="text-ink-2">
            Bạn đã đăng nhập nhưng chưa có hồ sơ nhân viên trong hệ thống. Liên
            hệ quản trị viên để được cấp quyền truy cập.
          </p>
        </div>
      </div>
    );
  }

  const [allowPublish, allowInbox, allowManageStaff, allowLark, roles] =
    await Promise.all([
      canPublish(profile.role),
      canViewInbox(profile.role),
      canManageStaff(profile.role),
      canAccessLark(profile.role),
      getRoles(),
    ]);
  // canPublish only covers "can manage/delete this site's own content"
  // (canManageContent) — a contributor-tier role that can only draft/save,
  // not publish, should still see these tabs unlocked to work on drafts.
  const allowContent =
    allowPublish || resolveRole(profile.role, roles).canDraftContent;

  // Every tab is always listed — hiding it entirely would make "this
  // employee should only create Lark files" look like the other features
  // don't exist. Locked (not hidden) tabs show visibly, just non-clickable.
  const navItems: NavItem[] = [
    { href: "/admin", label: "Tổng quan", icon: "overview" },
    {
      href: "/admin/tin-tuc",
      label: "Tin tức",
      icon: "news",
      locked: !allowContent,
    },
    {
      href: "/admin/tuyen-dung",
      label: "Tuyển dụng",
      icon: "jobs",
      locked: !allowContent,
    },
    {
      href: "/admin/san-pham",
      label: "Sản phẩm",
      icon: "products",
      locked: !allowContent,
    },
    {
      href: "/admin/lark",
      label: "Tạo file Lark",
      icon: "lark",
      locked: !allowLark,
    },
    // These 3 pages page-block on canPublish itself (not canDraftContent), so
    // their lock must mirror that exactly — unlocking on allowContent here
    // would show them clickable for a draft-only role that the page then
    // turns away, which is worse than just locking it up front.
    {
      href: "/admin/hinh-anh",
      label: "Hình ảnh",
      icon: "images",
      locked: !allowPublish,
    },
    {
      href: "/admin/noi-dung",
      label: "Nội dung",
      icon: "text",
      locked: !allowPublish,
    },
    {
      href: "/admin/lien-ket",
      label: "Liên hệ & Liên kết",
      icon: "link",
      locked: !allowPublish,
    },
    {
      href: "/admin/lien-he",
      label: "Hộp thư liên hệ",
      icon: "inbox",
      locked: !allowInbox,
    },
    {
      href: "/admin/nhan-su",
      label: "Nhân sự",
      icon: "staff",
      locked: !allowManageStaff,
    },
    {
      href: "/admin/danh-muc",
      label: "Danh mục",
      icon: "tags",
      locked: !allowManageStaff,
    },
  ];

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar profile={profile} items={navItems} roles={roles} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
