import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { NewsForm } from "../NewsForm";
import { updateNewsPost } from "../actions";
import type { NewsPost } from "@/lib/admin/types";

export default async function EditNewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("news_posts").select("*").eq("id", id).single();
  if (!data) notFound();

  const post = data as NewsPost;
  const action = updateNewsPost.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Sửa bài viết</h1>
      <NewsForm role={profile.role} post={post} action={action} />
    </div>
  );
}
