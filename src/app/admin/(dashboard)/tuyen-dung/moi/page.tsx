import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { JobForm } from "../JobForm";
import { createJobPost } from "../actions";

export default async function NewJobPostPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Đăng tin tuyển dụng</h1>
      <JobForm allowPublish={await canPublish(profile.role)} action={createJobPost} />
    </div>
  );
}
