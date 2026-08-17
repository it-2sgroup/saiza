import { getCurrentProfile } from "@/lib/supabase/profile";
import { JobForm } from "../JobForm";
import { createJobPost } from "../actions";

export default async function NewJobPostPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Đăng tin tuyển dụng</h1>
      <JobForm role={profile.role} action={createJobPost} />
    </div>
  );
}
