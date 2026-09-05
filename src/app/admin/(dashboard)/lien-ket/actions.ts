"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";

export type ConfigGroupFormState = { error: string | null; success: boolean };

export async function saveConfigGroup(keys: string[], _prev: ConfigGroupFormState, formData: FormData): Promise<ConfigGroupFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện.", success: false };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const rows = keys.map((key) => ({
    key,
    value: String(formData.get(key) ?? "").trim(),
    updated_by: profile.id,
    updated_at: now,
  }));

  const { error } = await admin.from("site_config").upsert(rows);
  if (error) return { error: `Không lưu được: ${error.message}`, success: false };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_config_group_saved",
    targetTable: "site_config",
    metadata: { keys },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/lien-ket");

  return { error: null, success: true };
}

export async function resetConfigGroup(prefix: string): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện." };

  const admin = createAdminClient();
  const { error } = await admin.from("site_config").delete().like("key", `${prefix}.%`);
  if (error) return { error: `Không khôi phục được: ${error.message}` };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_config_group_reset",
    targetTable: "site_config",
    metadata: { prefix },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/lien-ket");

  return { error: null };
}
