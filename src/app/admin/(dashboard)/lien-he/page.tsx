import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewInbox } from "@/lib/admin/permissions";
import { StatusSelect } from "./StatusSelect";
import type { ContactSubmission } from "@/lib/admin/types";

export default async function AdminContactInboxPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canViewInbox(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền xem hộp thư liên hệ.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
  const submissions = (data ?? []) as ContactSubmission[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Hộp thư liên hệ</h1>
      <div className="flex flex-col gap-3">
        {submissions.length === 0 && <p className="text-ink-2">Chưa có yêu cầu liên hệ nào.</p>}
        {submissions.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-card border border-line bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{item.name}</span>
                <span className="text-xs text-ink-2">{[item.phone, item.email, item.region].filter(Boolean).join(" · ")}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-2">{new Date(item.created_at).toLocaleString("vi-VN")}</span>
                <StatusSelect id={item.id} status={item.status} />
              </div>
            </div>
            {item.message && <p className="text-sm leading-[1.65] text-ink-2">{item.message}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
