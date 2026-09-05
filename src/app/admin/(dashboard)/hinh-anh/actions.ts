"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";

export type SiteImageUploadState = { error: string | null; success: boolean };

const MAX_SITE_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadSiteImage(key: string, _prev: SiteImageUploadState, formData: FormData): Promise<SiteImageUploadState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện.", success: false };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Chọn một ảnh để tải lên.", success: false };
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { error: "Chỉ nhận ảnh JPEG, PNG hoặc WEBP.", success: false };
  if (file.size > MAX_SITE_IMAGE_BYTES) return { error: "Ảnh tối đa 5MB.", success: false };

  // Fixed filename per key (upsert) — a re-upload overwrites the previous
  // file in Storage instead of accumulating orphaned files.
  const path = `${key}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage.from("site-images").upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: `Không tải lên được: ${uploadError.message}`, success: false };

  const { data: publicUrlData } = admin.storage.from("site-images").getPublicUrl(path);
  const url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await admin
    .from("site_images")
    .upsert({ key, url, updated_by: profile.id, updated_at: new Date().toISOString() });
  if (dbError) return { error: `Không lưu được: ${dbError.message}`, success: false };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_image_updated",
    targetTable: "site_images",
    targetId: key,
    metadata: { key },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/hinh-anh");

  return { error: null, success: true };
}

export async function resetSiteImage(key: string): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện." };

  const admin = createAdminClient();
  const { error } = await admin.from("site_images").delete().eq("key", key);
  if (error) return { error: `Không khôi phục được: ${error.message}` };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_image_reset",
    targetTable: "site_images",
    targetId: key,
    metadata: { key },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/hinh-anh");

  return { error: null };
}

// --- Open-ended lists (hero banners, KOL photos, about-page gallery) ---

export type SiteImageItemState = { error: string | null; success: boolean };

export async function addSiteImageItem(listKey: string, _prev: SiteImageItemState, formData: FormData): Promise<SiteImageItemState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện.", success: false };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Chọn một ảnh để tải lên.", success: false };
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { error: "Chỉ nhận ảnh JPEG, PNG hoặc WEBP.", success: false };
  if (file.size > MAX_SITE_IMAGE_BYTES) return { error: "Ảnh tối đa 5MB.", success: false };

  const label = String(formData.get("label") ?? "").trim() || null;

  const admin = createAdminClient();
  const id = crypto.randomUUID();
  const path = `items/${listKey}/${id}.${ext}`;

  const { error: uploadError } = await admin.storage.from("site-images").upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: `Không tải lên được: ${uploadError.message}`, success: false };

  const { data: publicUrlData } = admin.storage.from("site-images").getPublicUrl(path);
  const url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { count } = await admin.from("site_image_items").select("id", { count: "exact", head: true }).eq("list_key", listKey);

  const { error: dbError } = await admin.from("site_image_items").insert({
    id,
    list_key: listKey,
    url,
    label,
    sort_order: (count ?? 0) + 1,
    updated_by: profile.id,
  });
  if (dbError) return { error: `Không lưu được: ${dbError.message}`, success: false };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_image_item_added",
    targetTable: "site_image_items",
    targetId: id,
    metadata: { listKey, label },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/hinh-anh");

  return { error: null, success: true };
}

export async function replaceSiteImageItem(
  id: string,
  listKey: string,
  _prev: SiteImageItemState,
  formData: FormData,
): Promise<SiteImageItemState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện.", success: false };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Chọn một ảnh để tải lên.", success: false };
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { error: "Chỉ nhận ảnh JPEG, PNG hoặc WEBP.", success: false };
  if (file.size > MAX_SITE_IMAGE_BYTES) return { error: "Ảnh tối đa 5MB.", success: false };

  const admin = createAdminClient();
  const path = `items/${listKey}/${id}.${ext}`;

  const { error: uploadError } = await admin.storage.from("site-images").upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: `Không tải lên được: ${uploadError.message}`, success: false };

  const { data: publicUrlData } = admin.storage.from("site-images").getPublicUrl(path);
  const url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { error: dbError } = await admin.from("site_image_items").update({ url, updated_by: profile.id }).eq("id", id);
  if (dbError) return { error: `Không lưu được: ${dbError.message}`, success: false };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_image_item_updated",
    targetTable: "site_image_items",
    targetId: id,
    metadata: { listKey },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/hinh-anh");

  return { error: null, success: true };
}

export async function deleteSiteImageItem(id: string, listKey: string): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return { error: "Bạn không có quyền thực hiện." };

  const admin = createAdminClient();

  const { data: row } = await admin.from("site_image_items").select("url").eq("id", id).single();
  const extMatch = row?.url.match(/\.(\w+)(?:\?|$)/);
  if (extMatch) {
    await admin.storage.from("site-images").remove([`items/${listKey}/${id}.${extMatch[1]}`]);
  }

  const { error } = await admin.from("site_image_items").delete().eq("id", id);
  if (error) return { error: `Không xoá được: ${error.message}` };

  await recordAuditLog({
    actorId: profile.id,
    action: "site_image_item_deleted",
    targetTable: "site_image_items",
    targetId: id,
    metadata: { listKey },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/hinh-anh");

  return { error: null };
}
