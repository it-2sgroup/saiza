"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff } from "@/lib/admin/permissions";
import { recordAuditLog } from "@/lib/admin/audit";
import {
  addConfigOption,
  renameConfigOption,
  removeConfigOption,
  type ConfigListKey,
  type ConfigListMutationState,
} from "@/lib/admin/configLists";

const VALID_LIST_KEYS: ConfigListKey[] = ["department", "org_code", "doc_type"];

function parseListKey(formData: FormData): ConfigListKey | null {
  const key = String(formData.get("listKey") ?? "");
  return (VALID_LIST_KEYS as string[]).includes(key) ? (key as ConfigListKey) : null;
}

export async function addConfigOptionAction(_prev: ConfigListMutationState, formData: FormData): Promise<ConfigListMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return { error: "Bạn không có quyền thực hiện." };

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

export async function renameConfigOptionAction(_prev: ConfigListMutationState, formData: FormData): Promise<ConfigListMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return { error: "Bạn không có quyền thực hiện." };

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

export async function removeConfigOptionAction(listKey: ConfigListKey, code: string): Promise<ConfigListMutationState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return { error: "Bạn không có quyền thực hiện." };

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
