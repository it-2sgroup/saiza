import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canDelete, canPublish } from "@/lib/admin/permissions";
import { DeleteButton } from "./DeleteButton";
import { CloseButton } from "./CloseButton";
import type { JobPost } from "@/lib/admin/types";

const STATUS_LABEL: Record<JobPost["status"], string> = {
  draft: "Nháp",
  open: "Đang tuyển",
  closed: "Đã đóng",
};

const STATUS_TABS: { value: JobPost["status"] | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "open", label: "Đang tuyển" },
  { value: "draft", label: "Nháp" },
  { value: "closed", label: "Đã đóng" },
];

export default async function AdminJobsListPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { q, status } = await searchParams;
  const query = (q ?? "").trim();
  const activeStatus = (status ?? "") as JobPost["status"] | "";

  let request = supabase.from("job_posts").select("*").order("created_at", { ascending: false });
  if (query) request = request.ilike("title", `%${query}%`);
  if (activeStatus) request = request.eq("status", activeStatus);
  const { data } = await request;
  const jobs = (data ?? []) as JobPost[];

  const linkFor = (nextStatus: JobPost["status"] | "") => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextStatus) params.set("status", nextStatus);
    const qs = params.toString();
    return `/admin/tuyen-dung${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Tuyển dụng</h1>
        <Link
          href="/admin/tuyen-dung/moi"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink"
        >
          + Đăng tin tuyển dụng
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={linkFor(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-soft ${
              activeStatus === tab.value ? "bg-accent text-white" : "border border-line bg-card text-ink-2 hover:border-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form action="/admin/tuyen-dung" method="get" className="flex gap-2.5">
        {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
        <div className="relative max-w-[360px] flex-1">
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
            href={linkFor(activeStatus)}
            className="flex items-center rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      {jobs.length === 0 ? (
        <p className="text-ink-2">{query ? `Không tìm thấy tin khớp với "${query}".` : "Chưa có tin tuyển dụng nào."}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex flex-col overflow-hidden rounded-card border border-line bg-card transition-shadow duration-300 ease-soft hover:shadow-[0_8px_24px_rgba(22,33,62,0.10)]"
            >
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
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="line-clamp-2 text-[14.5px] font-semibold">{job.title}</span>
                  <span className="text-xs text-ink-2">
                    {STATUS_LABEL[job.status]}
                    {job.location ? ` · ${job.location}` : ""} · Cập nhật {new Date(job.updated_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                  <Link href={`/admin/tuyen-dung/${job.id}`} className="text-sm font-medium text-accent hover:text-ink">
                    Sửa →
                  </Link>
                  <div className="flex items-center gap-2">
                    {job.status === "open" && profile && canPublish(profile.role) && <CloseButton id={job.id} />}
                    {profile && canDelete(profile.role) && <DeleteButton id={job.id} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
