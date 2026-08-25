import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { LarkDocForm } from "./LarkDocForm";

type AuditRow = {
  actor_id: string | null;
  target_id: string | null;
  metadata: { title?: string; url?: string; shared?: boolean } | null;
  created_at: string;
};

export default async function AdminLarkPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const admin = createAdminClient();
  const { data: logRows } = await admin
    .from("audit_log")
    .select("actor_id, target_id, metadata, created_at")
    .eq("action", "lark_doc_created")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (logRows ?? []) as AuditRow[];
  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((id): id is string => !!id))];
  const { data: profilesData } =
    actorIds.length > 0 ? await admin.from("profiles").select("id, full_name").in("id", actorIds) : { data: [] };
  const nameById = new Map((profilesData ?? []).map((p) => [p.id, p.full_name as string]));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Tạo file Lark</h1>
        <p className="text-ink-2">
          Tạo tài liệu Lark Docs mới. Tài liệu sẽ tự động được chia sẻ cho email công ty của bạn nếu email đó là tài
          khoản Lark hợp lệ.
        </p>
      </div>

      <LarkDocForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Đã tạo gần đây</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có tài liệu nào được tạo.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map((row) => (
              <div
                key={row.target_id}
                className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium">{row.metadata?.title ?? "(không có tiêu đề)"}</span>
                  <span className="text-xs text-ink-2">
                    {(row.actor_id && nameById.get(row.actor_id)) ?? "—"} ·{" "}
                    {new Date(row.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                {row.metadata?.url && (
                  <a
                    href={row.metadata.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-accent underline whitespace-nowrap"
                  >
                    Mở
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
