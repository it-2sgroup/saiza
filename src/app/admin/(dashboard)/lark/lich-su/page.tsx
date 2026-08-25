import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShareExistingDoc } from "../ShareExistingDoc";
import type { StaffOption } from "../StaffSharePicker";

type AuditRow = {
  target_id: string | null;
  metadata: { title?: string; url?: string; shared?: boolean } | null;
  created_at: string;
};

const PAGE_SIZE = 30;

export default async function LarkHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ trang?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const page = Math.max(1, Number((await searchParams).trang) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  const [{ data: logRows, count }, { data: profilesData }, { data: usersData }] = await Promise.all([
    admin
      .from("audit_log")
      .select("target_id, metadata, created_at", { count: "exact" })
      .eq("action", "lark_doc_created")
      .eq("actor_id", profile.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    admin.from("profiles").select("id, full_name"),
    admin.auth.admin.listUsers(),
  ]);

  const rows = (logRows ?? []) as AuditRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);
  const staff: StaffOption[] = (profilesData ?? [])
    .map((p) => ({ id: p.id as string, full_name: p.full_name as string, email: emailById.get(p.id) ?? "" }))
    .filter((s): s is StaffOption => !!s.email);

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link href="/admin/lark" className="w-fit text-sm font-medium text-accent hover:text-ink">
          ← Quay lại Tạo file Lark
        </Link>
        <h1 className="text-xl font-medium">Lịch sử tạo file của bạn</h1>
        <p className="text-sm text-ink-2">{total} file — chỉ hiển thị file của chính bạn.</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-2">Bạn chưa tạo file nào.</p>
      ) : (
        <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-card">
          {rows.map((row) => (
            <div key={row.target_id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[14.5px] font-medium">
                    {row.metadata?.title ?? "(không có tiêu đề)"}
                  </span>
                  <span className="text-xs text-ink-2">{new Date(row.created_at).toLocaleString("vi-VN")}</span>
                </div>
                {row.metadata?.url && (
                  <a
                    href={row.metadata.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 text-sm font-medium text-accent hover:text-ink"
                  >
                    Mở →
                  </a>
                )}
              </div>
              {row.target_id && <ShareExistingDoc documentId={row.target_id} staff={staff} />}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href={`/admin/lark/lich-su?trang=${page - 1}`}
            aria-disabled={page <= 1}
            className={`text-sm font-medium ${page <= 1 ? "pointer-events-none text-ink-2 opacity-40" : "text-accent hover:text-ink"}`}
          >
            ← Trang trước
          </Link>
          <span className="text-sm text-ink-2">
            Trang {page} / {totalPages}
          </span>
          <Link
            href={`/admin/lark/lich-su?trang=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`text-sm font-medium ${page >= totalPages ? "pointer-events-none text-ink-2 opacity-40" : "text-accent hover:text-ink"}`}
          >
            Trang sau →
          </Link>
        </div>
      )}
    </div>
  );
}
