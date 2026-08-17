import { getCurrentProfile } from "@/lib/supabase/profile";
import { NewsForm } from "../NewsForm";
import { createNewsPost } from "../actions";

export default async function NewNewsPostPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Viết bài mới</h1>
      <NewsForm role={profile.role} action={createNewsPost} />
    </div>
  );
}
