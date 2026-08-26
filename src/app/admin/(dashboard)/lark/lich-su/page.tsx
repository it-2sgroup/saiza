import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShareExistingDoc } from "../ShareExistingDoc";
import { DeleteLarkFileButton } from "../DeleteLarkFileButton";
import type { StaffOption } from "../StaffSharePicker";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/client";

type AuditRow = {
  target_id: string | null;
  metadata: { title?: string; url?: string; shared?: boolean; fileType?: LarkFileType } | null;
  created_at: string;
};

const PAGE_SIZE = 24;

export default async function LarkHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ trang?: string; q?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.trang) || 1);
  const q = (sp.q ?? "").trim();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();
  const { data: deletedRows } = await admin.from("audit_log").select("target_id").eq("action", "lark_doc_deleted");
  const deletedIds = (deletedRows ?? []).map((r) => r.target_id).filter((id): id is string => !!id);

  let query = admin
    .from("audit_log")
    .select("target_id, metadata, created_at", { count: "exact" })
    .eq("action", "lark_doc_created")
    .eq("actor_id", profile.id);
  if (deletedIds.length > 0) query = query.not("target_id", "in", `(${deletedIds.join(",")})`);
  if (q) query = query.ilike("metadata->>title", `%${q}%`);

  const [{ data: logRows, count }, { data: profilesData }, { data: usersData }] = await Promise.all([
    query.order("created_at", { ascending: false }).range(from, to),
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

  const pageHref = (p: number) => `/admin/lark/lich-su?${q ? `q=${encodeURIComponent(q)}&` : ""}trang=${p}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link href="/admin/lark" className="w-fit text-sm font-medium text-accent hover:text-ink">
          ← Quay lại Tạo file Lark
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-medium">Lịch sử tạo file của bạn</h1>
          <span className="text-sm text-ink-2">{total} file</span>
        </div>
      </div>

      <form action="/admin/lark/lich-su" method="get" className="flex gap-2.5">
        <div className="relative flex-1">
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
            defaultValue={q}
            placeholder="Tìm theo tên file..."
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        {q && (
          <Link
            href="/admin/lark/lich-su"
            className="flex items-center rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-2">
          {q ? `Không tìm thấy file khớp với "${q}".` : "Bạn chưa tạo file nào."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.target_id}
              className="flex flex-col overflow-hidden rounded-card border border-line bg-card transition-shadow duration-300 ease-soft hover:shadow-[0_8px_24px_rgba(22,33,62,0.10)]"
            >
              <div className="flex h-20 flex-shrink-0 items-center justify-center bg-wash text-accent-2">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M9 13h6M9 17h6" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="line-clamp-2 text-[14px] font-medium break-all">
                    {row.metadata?.title ?? "(không có tiêu đề)"}
                  </span>
                  <span className="text-xs text-ink-2">
                    {LARK_FILE_TYPE_LABELS[row.metadata?.fileType ?? "docx"]} ·{" "}
                    {new Date(row.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="mt-auto flex flex-col gap-2 border-t border-line pt-2.5">
                  {row.metadata?.url && (
                    <a
                      href={row.metadata.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-accent hover:text-ink"
                    >
                      Mở →
                    </a>
                  )}
                  {row.target_id && (
                    <div className="flex items-center justify-between gap-2">
                      <ShareExistingDoc documentId={row.target_id} fileType={row.metadata?.fileType} staff={staff} />
                      <DeleteLarkFileButton documentId={row.target_id} fileType={row.metadata?.fileType} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href={pageHref(page - 1)}
            aria-disabled={page <= 1}
            className={`text-sm font-medium ${page <= 1 ? "pointer-events-none text-ink-2 opacity-40" : "text-accent hover:text-ink"}`}
          >
            ← Trang trước
          </Link>
          <span className="text-sm text-ink-2">
            Trang {page} / {totalPages}
          </span>
          <Link
            href={pageHref(page + 1)}
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
