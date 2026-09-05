"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish, canDelete } from "@/lib/admin/permissions";
import { uniqueSlug } from "@/lib/admin/slug";
import { recordAuditLog } from "@/lib/admin/audit";

export type JobFormState = { error: string | null };

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    department: String(formData.get("department") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    employment_type: String(formData.get("employment_type") ?? "").trim() || null,
    salary_note: String(formData.get("salary_note") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim(),
    requirements: String(formData.get("requirements") ?? "").trim(),
    benefits: String(formData.get("benefits") ?? "").trim(),
    wantsOpen: formData.get("publish") === "on",
  };
}

export async function createJobPost(_prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Cần có tên vị trí tuyển dụng." };

  const status = fields.wantsOpen && (await canPublish(profile.role)) ? "open" : "draft";

  const supabase = await createClient();
  const { error } = await supabase.from("job_posts").insert({
    slug: uniqueSlug(fields.title),
    title: fields.title,
    department: fields.department,
    location: fields.location,
    employment_type: fields.employment_type,
    salary_note: fields.salary_note,
    description: fields.description,
    requirements: fields.requirements,
    benefits: fields.benefits,
    status,
    author_id: profile.id,
    published_at: status === "open" ? new Date().toISOString() : null,
  });

  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidatePath("/admin/tuyen-dung");
  revalidatePath("/tuyen-dung");
  redirect("/admin/tuyen-dung");
}

export async function updateJobPost(id: string, _prev: JobFormState, formData: FormData): Promise<JobFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Cần có tên vị trí tuyển dụng." };

  const status = fields.wantsOpen && (await canPublish(profile.role)) ? "open" : "draft";

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_posts")
    .update({
      title: fields.title,
      department: fields.department,
      location: fields.location,
      employment_type: fields.employment_type,
      salary_note: fields.salary_note,
      description: fields.description,
      requirements: fields.requirements,
      benefits: fields.benefits,
      status,
      published_at: status === "open" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidatePath("/admin/tuyen-dung");
  revalidatePath("/tuyen-dung");
  redirect("/admin/tuyen-dung");
}

export async function closeJobPost(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) return;

  const supabase = await createClient();
  await supabase.from("job_posts").update({ status: "closed" }).eq("id", id);

  revalidatePath("/admin/tuyen-dung");
  revalidatePath("/tuyen-dung");
}

export async function deleteJobPost(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || !(await canDelete(profile.role))) return;

  const supabase = await createClient();
  await supabase.from("job_posts").delete().eq("id", id);

  await recordAuditLog({ actorId: profile.id, action: "job_post_deleted", targetTable: "job_posts", targetId: id });

  revalidatePath("/admin/tuyen-dung");
  revalidatePath("/tuyen-dung");
}
