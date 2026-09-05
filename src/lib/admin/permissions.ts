import "server-only";
import { getRoles } from "./roles";
import { resolveRole } from "./roleCapabilities";

// Every check here used to be a hardcoded switch on the exact string
// "admin"/"editor"/"contributor". Roles are now admin-editable (a `roles`
// table, see supabase/migrations/0019_custom_roles.sql), so each function
// reads its answer from that role's capability flags instead — a fresh
// small read per call rather than caching, since roles change rarely and
// this table is tiny (a handful of rows).

export async function canPublish(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canManageContent;
}

export async function canDelete(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canManageContent;
}

// Distinct from canDelete on purpose: canDelete governs this site's OWN
// content (Tin tức/Tuyển dụng/Sản phẩm), where "can manage content"
// legitimately means "can delete anything in this section". Lark documents
// are a different trust boundary — most of the org Drive was never created
// through this app at all, so this would mean "can move/delete/transfer
// ownership of any file in the company, including ones they've never seen
// before, that belongs to someone else." Only an owner (checked separately)
// or a role with canManageLarkOrgWide should be able to act on a Lark doc
// they didn't create.
export async function canManageAnyLarkDoc(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canManageLarkOrgWide;
}

// Base gate for the whole "Tạo file Lark" feature — create files, browse
// Drive, manage files this role's holder created themselves. Previously
// nothing checked this at all (any logged-in profile could call every Lark
// Server Action), which is exactly the gap that made a "this employee should
// ONLY create Lark files" role impossible to express. Deliberately separate
// from canManageLarkOrgWide (acting on files owned by someone else) and
// canViewLarkStats (company-wide analytics) — a role can have any one of
// these three without the others.
export async function canAccessLark(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canAccessLark;
}

// The "Thống kê" tab and the company-wide rows/counts on "Tổng quan" — used
// to piggyback on canManageStaff, which conflated "can administer staff
// accounts" with "can see company-wide Lark stats". Split into its own
// capability so a role can have either without the other.
export async function canViewLarkStats(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canViewLarkStats;
}

export async function canViewInbox(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canViewInbox;
}

export async function canManageStaff(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).canManageStaff;
}

export async function isSuperAdmin(role: string): Promise<boolean> {
  const roles = await getRoles();
  return resolveRole(role, roles).isSuperAdmin;
}
