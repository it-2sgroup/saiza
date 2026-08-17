import { getCurrentProfile } from "@/lib/supabase/profile";
import { createClient } from "@/lib/supabase/server";
import { canManageStaff, canViewInbox } from "@/lib/admin/permissions";
import { DashboardCharts } from "./DashboardCharts";
import type { PostStatus, JobStatus, ContactStatus } from "@/lib/admin/types";
import type { StaffRole } from "@/lib/supabase/profile";

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

  const [newsRes, jobsRes] = await Promise.all([
    supabase.from("news_posts").select("status"),
    supabase.from("job_posts").select("status"),
  ]);

  const news = countBy<PostStatus, "status">(newsRes.data, "status", ["draft", "published"]);
  const jobs = countBy<JobStatus, "status">(jobsRes.data, "status", ["draft", "open", "closed"]);

  let contacts;
  if (canViewInbox(profile.role)) {
    const { data } = await supabase.from("contact_submissions").select("status, created_at");
    const statusCounts = countBy<ContactStatus, "status">(data, "status", ["new", "contacted", "archived"]);
    contacts = { ...statusCounts, trend: buildTrend(data) };
  }

  let staff;
  if (canManageStaff(profile.role)) {
    const { data } = await supabase.from("profiles").select("role");
    staff = countBy<StaffRole, "role">(data, "role", ["admin", "editor", "contributor"]);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Chào {profile.full_name}</h1>
        <p className="text-ink-2">Tổng quan hoạt động nội dung trên website.</p>
      </div>
      <DashboardCharts news={news} jobs={jobs} contacts={contacts} staff={staff} />
    </div>
  );
}
