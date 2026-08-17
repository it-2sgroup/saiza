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

export default async function AdminJobsListPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("job_posts").select("*").order("created_at", { ascending: false });
  const jobs = (data ?? []) as JobPost[];

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
      <div className="flex flex-col gap-3">
        {jobs.length === 0 && <p className="text-ink-2">Chưa có tin tuyển dụng nào.</p>}
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-5"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-semibold">{job.title}</span>
              <span className="text-xs text-ink-2">
                {STATUS_LABEL[job.status]}
                {job.location ? ` · ${job.location}` : ""} · Cập nhật{" "}
                {new Date(job.updated_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              {job.status === "open" && profile && canPublish(profile.role) && <CloseButton id={job.id} />}
              <Link
                href={`/admin/tuyen-dung/${job.id}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors duration-300 ease-soft hover:border-ink"
              >
                Sửa
              </Link>
              {profile && canDelete(profile.role) && <DeleteButton id={job.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
