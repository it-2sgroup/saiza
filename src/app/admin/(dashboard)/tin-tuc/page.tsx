import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canDelete } from "@/lib/admin/permissions";
import { DeleteButton } from "./DeleteButton";
import type { NewsPost } from "@/lib/admin/types";

export default async function AdminNewsListPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("news_posts").select("*").order("created_at", { ascending: false });
  const posts = (data ?? []) as NewsPost[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Tin tức</h1>
        <Link
          href="/admin/tin-tuc/moi"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink"
        >
          + Viết bài mới
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {posts.length === 0 && <p className="text-ink-2">Chưa có bài viết nào.</p>}
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-5"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold">{post.title}</span>
              <span className="text-xs text-ink-2">
                {post.status === "published" ? "Đã xuất bản" : "Nháp"} · Cập nhật{" "}
                {new Date(post.updated_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Link
                href={`/admin/tin-tuc/${post.id}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors duration-300 ease-soft hover:border-ink"
              >
                Sửa
              </Link>
              {profile && canDelete(profile.role) && <DeleteButton id={post.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
