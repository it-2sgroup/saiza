import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canDelete } from "@/lib/admin/permissions";
import { DeleteButton } from "./DeleteButton";
import type { NewsPost } from "@/lib/admin/types";

export default async function AdminNewsListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let request = supabase.from("news_posts").select("*").order("created_at", { ascending: false });
  if (query) request = request.ilike("title", `%${query}%`);
  const { data } = await request;
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

      <form action="/admin/tin-tuc" method="get" className="flex gap-2.5">
        <div className="relative flex-1 max-w-[360px]">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Tìm theo tiêu đề..."
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        {query && (
          <Link
            href="/admin/tin-tuc"
            className="flex items-center rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      {posts.length === 0 ? (
        <p className="text-ink-2">{query ? `Không tìm thấy bài viết khớp với "${query}".` : "Chưa có bài viết nào."}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex flex-col overflow-hidden rounded-card border border-line bg-card transition-shadow duration-300 ease-soft hover:shadow-[0_8px_24px_rgba(22,33,62,0.10)]"
            >
              {post.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- Storage/arbitrary host
                <img src={post.cover_image} alt="" className="h-28 w-full flex-shrink-0 object-cover" />
              ) : (
                <div className="flex h-20 flex-shrink-0 items-center justify-center bg-wash text-accent-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
                    <path d="M9 13h6" />
                    <path d="M9 17h6" />
                  </svg>
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="line-clamp-2 text-[14.5px] font-semibold">{post.title}</span>
                  <span className="text-xs text-ink-2">
                    {post.status === "published" ? "Đã xuất bản" : "Nháp"} · Cập nhật{" "}
                    {new Date(post.updated_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  <Link href={`/admin/tin-tuc/${post.id}`} className="text-sm font-medium text-accent hover:text-ink">
                    Sửa →
                  </Link>
                  {profile && canDelete(profile.role) && <DeleteButton id={post.id} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
