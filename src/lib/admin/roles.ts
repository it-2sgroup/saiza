import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveRole, resolveRoleLabel, type RoleOption } from "./roleCapabilities";

export type { RoleOption };
export { resolveRole, resolveRoleLabel };

// Fallback used only if the table is unreachable (migration not applied
// yet) — same defensive pattern as configLists.ts, so a not-yet-migrated
// deployment keeps behaving exactly like the old hardcoded 3-role model.
const FALLBACK: RoleOption[] = [
  {
    code: "admin",
    label: "Quản trị",
    isSuperAdmin: true,
    canManageContent: true,
    canDraftContent: true,
    canManageLarkOrgWide: true,
    canViewInbox: true,
    canManageStaff: true,
  },
  {
    code: "editor",
    label: "Biên tập viên",
    isSuperAdmin: false,
    canManageContent: true,
    canDraftContent: true,
    canManageLarkOrgWide: false,
    canViewInbox: true,
    canManageStaff: false,
  },
  {
    code: "contributor",
    label: "Cộng tác viên",
    isSuperAdmin: false,
    canManageContent: false,
    canDraftContent: true,
    canManageLarkOrgWide: false,
    canViewInbox: false,
    canManageStaff: false,
  },
];

type RoleRow = {
  code: string;
  label: string;
  is_super_admin: boolean;
  can_manage_content: boolean;
  can_draft_content: boolean;
  can_manage_lark_org_wide: boolean;
  can_view_inbox: boolean;
  can_manage_staff: boolean;
};

function fromRow(r: RoleRow): RoleOption {
  return {
    code: r.code,
    label: r.label,
    isSuperAdmin: r.is_super_admin,
    canManageContent: r.can_manage_content,
    canDraftContent: r.can_draft_content,
    canManageLarkOrgWide: r.can_manage_lark_org_wide,
    canViewInbox: r.can_view_inbox,
    canManageStaff: r.can_manage_staff,
  };
}

/** Every role and its capabilities — the single read behind every permission check and the Nhân sự/Danh mục role dropdowns. */
export async function getRoles(): Promise<RoleOption[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("roles")
    .select(
      "code, label, is_super_admin, can_manage_content, can_draft_content, can_manage_lark_org_wide, can_view_inbox, can_manage_staff",
    )
    .order("sort_order");
  if (error || !data || data.length === 0) return FALLBACK;
  return data.map(fromRow);
}

export type RoleMutationState = { error: string | null; success?: boolean };

export type RoleCapabilitiesInput = {
  isSuperAdmin: boolean;
  canManageContent: boolean;
  canDraftContent: boolean;
  canManageLarkOrgWide: boolean;
  canViewInbox: boolean;
  canManageStaff: boolean;
};

function toRow(caps: RoleCapabilitiesInput) {
  return {
    is_super_admin: caps.isSuperAdmin,
    can_manage_content: caps.canManageContent,
    can_draft_content: caps.canDraftContent,
    can_manage_lark_org_wide: caps.canManageLarkOrgWide,
    can_view_inbox: caps.canViewInbox,
    can_manage_staff: caps.canManageStaff,
  };
}

async function nextSortOrder(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data } = await admin.from("roles").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function addRole(code: string, label: string, caps: RoleCapabilitiesInput): Promise<RoleMutationState> {
  const admin = createAdminClient();
  const sortOrder = await nextSortOrder(admin);
  const { error } = await admin.from("roles").insert({ code, label, sort_order: sortOrder, ...toRow(caps) });
  if (error) {
    if (error.code === "23505") return { error: "Mã vai trò này đã tồn tại." };
    return { error: "Không thêm được. Vui lòng thử lại." };
  }
  return { error: null, success: true };
}

export async function updateRole(code: string, label: string, caps: RoleCapabilitiesInput): Promise<RoleMutationState> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("roles")
    .update({ label, ...toRow(caps) })
    .eq("code", code);
  if (error) return { error: "Không lưu được. Vui lòng thử lại." };
  return { error: null, success: true };
}

// The FK from profiles.role → roles.code (no cascade) makes Postgres reject
// this outright if anyone still has the role — surfaced here as a friendly
// message instead of a raw constraint-violation error.
export async function removeRole(code: string): Promise<RoleMutationState> {
  const admin = createAdminClient();
  const { error } = await admin.from("roles").delete().eq("code", code);
  if (error) {
    if (error.code === "23503") return { error: "Còn nhân viên đang dùng vai trò này — đổi vai trò của họ trước." };
    return { error: "Không xoá được. Vui lòng thử lại." };
  }
  return { error: null, success: true };
}
