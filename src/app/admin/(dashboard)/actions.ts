"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { recordAuditLog } from "@/lib/admin/audit";

export type AvatarUploadState = { error: string | null; avatarUrl: string | null };

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadAvatar(_prev: AvatarUploadState, formData: FormData): Promise<AvatarUploadState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại.", avatarUrl: null };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Chọn một ảnh để tải lên.", avatarUrl: null };
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Chỉ nhận ảnh JPEG, PNG hoặc WEBP.", avatarUrl: null };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { error: "Ảnh tối đa 2MB.", avatarUrl: null };
  }

  // Fixed filename per user (upsert) — a re-upload overwrites the previous
  // avatar in Storage instead of accumulating orphaned files.
  const path = `${profile.id}/avatar.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: `Không tải lên được: ${uploadError.message}`, avatarUrl: null };

  const { data: publicUrlData } = admin.storage.from("avatars").getPublicUrl(path);
  // Cache-bust so the browser doesn't keep showing the previous avatar under
  // the same URL after a re-upload.
  const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await admin.from("profiles").update({ avatar_url: avatarUrl }).eq("id", profile.id);
  if (updateError) return { error: `Không lưu được: ${updateError.message}`, avatarUrl: null };

  await recordAuditLog({
    actorId: profile.id,
    action: "avatar_updated",
    targetTable: "profiles",
    targetId: profile.id,
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/ho-so");
  revalidatePath("/admin/nhan-su");

  return { error: null, avatarUrl };
}

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await recordAuditLog({ actorId: user.id, action: "logout" });
  }

  redirect("/admin/login");
}
