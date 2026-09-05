import type { StaffRole } from "@/lib/supabase/profile";

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Quản trị",
  editor: "Biên tập viên",
  contributor: "Cộng tác viên",
};

export function canPublish(role: StaffRole) {
  return role === "admin" || role === "editor";
}

export function canDelete(role: StaffRole) {
  return role === "admin" || role === "editor";
}

// Distinct from canDelete on purpose: canDelete governs this site's OWN
// content (Tin tức/Tuyển dụng/Sản phẩm), where "editor" legitimately means
// "can delete anything in this section". Lark documents are a different
// trust boundary — most of the org Drive was never created through this
// app at all, so "editor" there would mean "can move/delete/transfer
// ownership of any file in the company, including ones they've never seen
// before, that belongs to someone else." Only an owner (checked separately)
// or an admin should be able to act on a Lark doc they didn't create.
export function canManageAnyLarkDoc(role: StaffRole) {
  return role === "admin";
}

export function canViewInbox(role: StaffRole) {
  return role === "admin" || role === "editor";
}

export function canManageStaff(role: StaffRole) {
  return role === "admin";
}
