"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, isSuperAdmin } from "@/lib/admin/permissions";
import { recordAuditLog } from "@/lib/admin/audit";
import {
  addConfigOption,
  renameConfigOption,
  removeConfigOption,
  type ConfigListKey,
  type ConfigListMutationState,
} from "@/lib/admin/configLists";
import {
  addRole,
  updateRole,
  removeRole,
  type RoleMutationState,
} from "@/lib/admin/roles";

const VALID_LIST_KEYS: ConfigListKey[] = ["department", "org_code", "doc_type"];

function parseListKey(formData: FormData): ConfigListKey | null {
  const key = String(formData.get("listKey") ?? "");
  return (VALID_LIST_KEYS as string[]).includes(key)
    ? (key as ConfigListKey)
    : null;
}

export async function addConfigOptionAction(
  _prev: ConfigListMutationState,
  formData: FormData,
): Promise<ConfigListMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  const listKey = parseListKey(formData);
  if (!listKey) return { error: "Danh mục không hợp lệ." };

  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!code || !label) return { error: "Nhập đủ mã và tên hiển thị." };

  const result = await addConfigOption(listKey, code, label, note || null);
  if (result.error) return result;

  await recordAuditLog({
    actorId: profile.id,
    action: "config_option_added",
    targetTable: "config_lists",
    targetId: `${listKey}:${code}`,
    metadata: { listKey, code, label },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/lark");
  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}

export async function renameConfigOptionAction(
  _prev: ConfigListMutationState,
  formData: FormData,
): Promise<ConfigListMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  const listKey = parseListKey(formData);
  if (!listKey) return { error: "Danh mục không hợp lệ." };

  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!code || !label) return { error: "Nhập đủ mã và tên hiển thị." };

  const result = await renameConfigOption(listKey, code, label, note || null);
  if (result.error) return result;

  await recordAuditLog({
    actorId: profile.id,
    action: "config_option_renamed",
    targetTable: "config_lists",
    targetId: `${listKey}:${code}`,
    metadata: { listKey, code, label },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/lark");
  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}

export async function removeConfigOptionAction(
  listKey: ConfigListKey,
  code: string,
): Promise<ConfigListMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  const result = await removeConfigOption(listKey, code);
  if (result.error) return result;

  await recordAuditLog({
    actorId: profile.id,
    action: "config_option_removed",
    targetTable: "config_lists",
    targetId: `${listKey}:${code}`,
    metadata: { listKey, code },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/lark");
  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}

// Roles are gated on isSuperAdmin specifically, not canManageStaff — a role
// bundles capabilities including canManageStaff itself, so anyone who could
// edit roles could grant themselves (or anyone) canManageLarkOrgWide/
// isSuperAdmin too. Only the structural "true admin" tier should hold that.
function parseRoleCaps(formData: FormData) {
  return {
    isSuperAdmin: formData.get("isSuperAdmin") === "on",
    canManageContent: formData.get("canManageContent") === "on",
    canDraftContent: formData.get("canDraftContent") === "on",
    canAccessLark: formData.get("canAccessLark") === "on",
    canManageLarkOrgWide: formData.get("canManageLarkOrgWide") === "on",
    canViewLarkStats: formData.get("canViewLarkStats") === "on",
    canViewInbox: formData.get("canViewInbox") === "on",
    canManageStaff: formData.get("canManageStaff") === "on",
  };
}

export async function addRoleAction(
  _prev: RoleMutationState,
  formData: FormData,
): Promise<RoleMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await isSuperAdmin(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!code || !label) return { error: "Nhập đủ mã và tên hiển thị." };

  const result = await addRole(code, label, parseRoleCaps(formData));
  if (result.error) return result;

  await recordAuditLog({
    actorId: profile.id,
    action: "role_added",
    targetTable: "roles",
    targetId: code,
    metadata: { label },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}

export async function updateRoleAction(
  _prev: RoleMutationState,
  formData: FormData,
): Promise<RoleMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await isSuperAdmin(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  const code = String(formData.get("code") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!code || !label) return { error: "Nhập đủ mã và tên hiển thị." };

  const result = await updateRole(code, label, parseRoleCaps(formData));
  if (result.error) return result;

  await recordAuditLog({
    actorId: profile.id,
    action: "role_updated",
    targetTable: "roles",
    targetId: code,
    metadata: { label },
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}

export async function removeRoleAction(
  code: string,
): Promise<RoleMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await isSuperAdmin(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  const result = await removeRole(code);
  if (result.error) return result;

  await recordAuditLog({
    actorId: profile.id,
    action: "role_removed",
    targetTable: "roles",
    targetId: code,
  });

  revalidatePath("/admin/danh-muc");
  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}
