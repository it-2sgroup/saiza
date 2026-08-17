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

export function canViewInbox(role: StaffRole) {
  return role === "admin" || role === "editor";
}

export function canManageStaff(role: StaffRole) {
  return role === "admin";
}
