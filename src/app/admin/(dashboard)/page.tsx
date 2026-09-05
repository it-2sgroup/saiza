import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { canManageStaff, canViewInbox } from "@/lib/admin/permissions";
import { getRoles, resolveRoleLabel } from "@/lib/admin/roles";
import { DashboardCharts } from "./DashboardCharts";
import { StatTile } from "./StatTile";
import type { PostStatus, JobStatus, ContactStatus } from "@/lib/admin/types";

function countBy<T extends string, K extends string>(rows: Record<K, T>[] | null, field: K, keys: readonly T[]) {
  const result = {} as Record<T, number>;
  keys.forEach((key) => (result[key] = 0));
  (rows ?? []).forEach((row) => {
    const value = row[field];
    result[value] = (result[value] ?? 0) + 1;
  });
  return result;
}

function buildTrend(rows: { created_at: string }[] | null) {
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  (rows ?? []).forEach((row) => {
    const key = row.created_at.slice(0, 10);
    const day = days.find((d) => d.date === key);
    if (day) day.count += 1;
  });
  return days;
}

export default async function AdminDashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  const [newsRes, jobsRes, productsRes] = await Promise.all([
    supabase.from("news_posts").select("status"),
    supabase.from("job_posts").select("status"),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);

  const news = countBy<PostStatus, "status">(newsRes.data, "status", ["draft", "published"]);
  const jobs = countBy<JobStatus, "status">(jobsRes.data, "status", ["draft", "open", "closed"]);
  const totalProducts = productsRes.count ?? 0;
  const heroTotal = news.published + jobs.open + totalProducts;

  let contacts;
  if (await canViewInbox(profile.role)) {
    const { data } = await supabase.from("contact_submissions").select("status, created_at");
    const statusCounts = countBy<ContactStatus, "status">(data, "status", ["new", "contacted", "archived"]);
    contacts = { ...statusCounts, trend: buildTrend(data) };
  }

  let staff: { label: string; count: number }[] | undefined;
  if (await canManageStaff(profile.role)) {
    const [{ data }, roles] = await Promise.all([supabase.from("profiles").select("role"), getRoles()]);
    const counts = countBy<string, "role">(
      data,
      "role",
      roles.map((r) => r.code),
    );
    staff = roles.map((r) => ({ label: resolveRoleLabel(r.code, roles) ?? r.code, count: counts[r.code] ?? 0 }));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Chào {profile.full_name}</h1>
        <p className="text-ink-2">Tổng quan hoạt động nội dung trên website.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="admin-hero-gradient flex flex-col justify-between gap-6 rounded-card p-6 text-white lg:col-span-1">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-white/80">Tổng nội dung đang hoạt động</span>
            <span className="text-4xl font-semibold">{heroTotal}</span>
            <span className="text-xs text-white/70">
              {news.published} bài viết · {jobs.open} tin tuyển dụng · {totalProducts} sản phẩm
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/tin-tuc/moi"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-accent transition-opacity duration-300 ease-soft hover:opacity-90"
            >
              + Bài viết
            </Link>
            <Link
              href="/admin/tuyen-dung/moi"
              className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-white/25"
            >
              + Tuyển dụng
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-card border border-line bg-card p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Hoạt động chi tiết</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Tin tức" value={news.draft + news.published} sub={`${news.published} đã đăng`} />
            <StatTile label="Tuyển dụng đang mở" value={jobs.open} sub={`${jobs.draft} nháp`} />
            <StatTile label="Sản phẩm" value={totalProducts} />
            {contacts && <StatTile label="Liên hệ chưa đọc" value={contacts.new} sub={`${contacts.contacted} đã liên hệ`} />}
          </div>
        </div>
      </div>
      <DashboardCharts news={news} jobs={jobs} contacts={contacts} staff={staff} />
    </div>
  );
}
