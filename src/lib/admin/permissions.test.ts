import { describe, it, expect } from "vitest";
import { canPublish, canDelete, canViewInbox, canManageStaff, canManageAnyLarkDoc, ROLE_LABELS } from "./permissions";
import type { StaffRole } from "@/lib/supabase/profile";

const ROLES: StaffRole[] = ["admin", "editor", "contributor"];

describe("permission matrix", () => {
  it("canPublish: admin and editor only", () => {
    expect(ROLES.filter(canPublish)).toEqual(["admin", "editor"]);
  });

  it("canDelete: admin and editor only (site content, not Lark docs)", () => {
    expect(ROLES.filter(canDelete)).toEqual(["admin", "editor"]);
  });

  it("canViewInbox: admin and editor only", () => {
    expect(ROLES.filter(canViewInbox)).toEqual(["admin", "editor"]);
  });

  it("canManageStaff: admin only", () => {
    expect(ROLES.filter(canManageStaff)).toEqual(["admin"]);
  });

  it("canManageAnyLarkDoc: admin only — deliberately stricter than canDelete", () => {
    expect(ROLES.filter(canManageAnyLarkDoc)).toEqual(["admin"]);
    // The whole point of this permission existing separately: an editor must
    // NOT be able to move/delete/transfer a Lark doc they don't own, even
    // though editor passes canDelete for the site's own content types.
    expect(canManageAnyLarkDoc("editor")).toBe(false);
    expect(canDelete("editor")).toBe(true);
  });

  it("every role has a label", () => {
    for (const role of ROLES) expect(ROLE_LABELS[role]).toBeTruthy();
  });
});
