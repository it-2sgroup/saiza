"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish, canDelete } from "@/lib/admin/permissions";
import { uniqueSlug } from "@/lib/admin/slug";
import { recordAuditLog } from "@/lib/admin/audit";

export type NewsFormState = { error: string | null };

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    tag: String(formData.get("tag") ?? "").trim() || null,
    cover_image: String(formData.get("cover_image") ?? "").trim() || null,
    wantsPublish: formData.get("publish") === "on",
  };
}

export async function createNewsPost(_prev: NewsFormState, formData: FormData): Promise<NewsFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const { title, excerpt, body, tag, cover_image, wantsPublish } = readFields(formData);
  if (!title) return { error: "Cần có tiêu đề." };

  const status = wantsPublish && (await canPublish(profile.role)) ? "published" : "draft";

  const supabase = await createClient();
  const { error } = await supabase.from("news_posts").insert({
    slug: uniqueSlug(title),
    title,
    excerpt,
    body,
    tag,
    cover_image,
    status,
    author_id: profile.id,
    published_at: status === "published" ? new Date().toISOString() : null,
  });

  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
  redirect("/admin/tin-tuc");
}

export async function updateNewsPost(id: string, _prev: NewsFormState, formData: FormData): Promise<NewsFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const { title, excerpt, body, tag, cover_image, wantsPublish } = readFields(formData);
  if (!title) return { error: "Cần có tiêu đề." };

  const status = wantsPublish && (await canPublish(profile.role)) ? "published" : "draft";

  const supabase = await createClient();
  const { error } = await supabase
    .from("news_posts")
    .update({
      title,
      excerpt,
      body,
      tag,
      cover_image,
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
  redirect("/admin/tin-tuc");
}

export async function deleteNewsPost(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || !(await canDelete(profile.role))) return;

  const supabase = await createClient();
  await supabase.from("news_posts").delete().eq("id", id);

  await recordAuditLog({ actorId: profile.id, action: "news_post_deleted", targetTable: "news_posts", targetId: id });

  revalidatePath("/admin/tin-tuc");
  revalidatePath("/tin-tuc");
}
