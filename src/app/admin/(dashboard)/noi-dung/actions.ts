"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";

export type TextGroupFormState = { error: string | null; success: boolean };

export async function saveTextGroup(
  keys: string[],
  _prev: TextGroupFormState,
  formData: FormData,
): Promise<TextGroupFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canPublish(profile.role)) return { error: "Bạn không có quyền thực hiện.", success: false };

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const rows = keys.map((key) => ({
    key,
    value_vi: String(formData.get(`${key}__vi`) ?? ""),
    value_en: String(formData.get(`${key}__en`) ?? ""),
    updated_by: profile.id,
    updated_at: now,
  }));

  const { error } = await admin.from("site_text").upsert(rows);
  if (error) return { error: `Không lưu được: ${error.message}`, success: false };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_text_group_saved",
    targetTable: "site_text",
    metadata: { keys },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/noi-dung");

  return { error: null, success: true };
}

export async function resetTextGroup(prefix: string): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || !canPublish(profile.role)) return { error: "Bạn không có quyền thực hiện." };

  const admin = createAdminClient();
  const { error } = await admin.from("site_text").delete().like("key", `${prefix}.%`);
  if (error) return { error: `Không khôi phục được: ${error.message}` };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_text_group_reset",
    targetTable: "site_text",
    metadata: { prefix },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/noi-dung");

  return { error: null };
}
