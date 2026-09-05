import { describe, it, expect } from "vitest";
import {
  resolveRole,
  resolveRoleLabel,
  type RoleOption,
} from "./roleCapabilities";

// permissions.ts itself calls getRoles() (server-only, hits Supabase) — the
// actual capability logic worth unit-testing is resolveRole/resolveRoleLabel,
// same split as configLists.ts/configListHelpers.ts.
const ROLES: RoleOption[] = [
  {
    code: "admin",
    label: "Quản trị",
    isSuperAdmin: true,
    canManageContent: true,
    canDraftContent: true,
    canAccessLark: true,
    canManageLarkOrgWide: true,
    canViewLarkStats: true,
    canViewInbox: true,
    canManageStaff: true,
  },
  {
    code: "editor",
    label: "Biên tập viên",
    isSuperAdmin: false,
    canManageContent: true,
    canDraftContent: true,
    canAccessLark: true,
    canManageLarkOrgWide: false,
    canViewLarkStats: false,
    canViewInbox: true,
    canManageStaff: false,
  },
  {
    code: "contributor",
    label: "Cộng tác viên",
    isSuperAdmin: false,
    canManageContent: false,
    canDraftContent: true,
    canAccessLark: true,
    canManageLarkOrgWide: false,
    canViewLarkStats: false,
    canViewInbox: false,
    canManageStaff: false,
  },
];

describe("resolveRole", () => {
  it("canManageContent: admin and editor only", () => {
    expect(
      ROLES.filter((r) => resolveRole(r.code, ROLES).canManageContent).map(
        (r) => r.code,
      ),
    ).toEqual(["admin", "editor"]);
  });

  it("canViewInbox: admin and editor only", () => {
    expect(
      ROLES.filter((r) => resolveRole(r.code, ROLES).canViewInbox).map(
        (r) => r.code,
      ),
    ).toEqual(["admin", "editor"]);
  });

  it("canManageStaff: admin only", () => {
    expect(
      ROLES.filter((r) => resolveRole(r.code, ROLES).canManageStaff).map(
        (r) => r.code,
      ),
    ).toEqual(["admin"]);
  });

  it("canManageLarkOrgWide: admin only — deliberately stricter than canManageContent", () => {
    // The whole point of this capability existing separately: an editor must
    // NOT be able to move/delete/transfer a Lark doc they don't own, even
    // though editor has canManageContent for the site's own content types.
    expect(resolveRole("editor", ROLES).canManageLarkOrgWide).toBe(false);
    expect(resolveRole("editor", ROLES).canManageContent).toBe(true);
  });

  it("falls back to all-false capabilities for a renamed/removed role instead of throwing", () => {
    const caps = resolveRole("DELETED_ROLE", ROLES);
    expect(caps.isSuperAdmin).toBe(false);
    expect(caps.canManageContent).toBe(false);
    expect(caps.canManageStaff).toBe(false);
  });

  it("every seeded role has a label", () => {
    for (const role of ROLES)
      expect(resolveRoleLabel(role.code, ROLES)).toBeTruthy();
  });
});
