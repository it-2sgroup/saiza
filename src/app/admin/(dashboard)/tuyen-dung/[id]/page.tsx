import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { JobForm } from "../JobForm";
import { updateJobPost } from "../actions";
import type { JobPost } from "@/lib/admin/types";

export default async function EditJobPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("job_posts").select("*").eq("id", id).single();
  if (!data) notFound();

  const job = data as JobPost;
  const action = updateJobPost.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Sửa tin tuyển dụng</h1>
      <JobForm role={profile.role} job={job} action={action} />
    </div>
  );
}
