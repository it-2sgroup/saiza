// Client-safe (no "server-only") — same reasoning as configListHelpers.ts:
// split out so a client component can resolve a role's label/capabilities
// from a list already fetched server-side, without pulling the Supabase
// admin client into the client bundle.
export type RoleOption = {
  code: string;
  label: string;
  isSuperAdmin: boolean;
  canManageContent: boolean;
  canDraftContent: boolean;
  canAccessLark: boolean;
  canManageLarkOrgWide: boolean;
  canViewLarkStats: boolean;
  canViewInbox: boolean;
  canManageStaff: boolean;
};

// Returned for a role code that no longer exists (renamed/deleted after a
// profile was already assigned it, or a not-yet-migrated deployment) —
// fails closed (every capability false) rather than throwing or silently
// granting access.
const NONE: Omit<RoleOption, "code" | "label"> = {
  isSuperAdmin: false,
  canManageContent: false,
  canDraftContent: false,
  canAccessLark: false,
  canManageLarkOrgWide: false,
  canViewLarkStats: false,
  canViewInbox: false,
  canManageStaff: false,
};

export function resolveRole(
  code: string | null | undefined,
  roles: RoleOption[],
): RoleOption {
  const found = code ? roles.find((r) => r.code === code) : undefined;
  return found ?? { code: code ?? "", label: code ?? "(chưa gán)", ...NONE };
}

export function resolveRoleLabel(
  code: string | null | undefined,
  roles: RoleOption[],
): string | null {
  if (!code) return null;
  return roles.find((r) => r.code === code)?.label ?? code;
}
