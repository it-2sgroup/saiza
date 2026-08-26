import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageStaff } from "@/lib/admin/permissions";
import { DEPARTMENTS, departmentLabel } from "@/lib/admin/departments";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/client";
import { DeleteLarkFileButton } from "../DeleteLarkFileButton";

type AuditRow = {
  actor_id: string | null;
  target_id: string | null;
  metadata: { title?: string; url?: string; fileType?: LarkFileType } | null;
  created_at: string;
};

const PAGE_SIZE = 30;

export default async function LarkAdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ trang?: string; q?: string; phongBan?: string; loai?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.trang) || 1);
  const q = (sp.q ?? "").trim().toLowerCase();
  const departmentFilter = sp.phongBan ?? "";
  const fileTypeFilter = (sp.loai ?? "") as LarkFileType | "";

  const admin = createAdminClient();
  const [{ data: createdRows }, { data: deletedRows }, { data: profilesData }] = await Promise.all([
    admin
      .from("audit_log")
      .select("actor_id, target_id, metadata, created_at")
      .eq("action", "lark_doc_created")
      .order("created_at", { ascending: false }),
    admin.from("audit_log").select("target_id").eq("action", "lark_doc_deleted"),
    admin.from("profiles").select("id, full_name, department"),
  ]);

  const deletedIds = new Set((deletedRows ?? []).map((r) => r.target_id));
  const profileById = new Map(
    (profilesData ?? []).map((p) => [p.id as string, { fullName: p.full_name as string, department: p.department as string | null }]),
  );

  const allRows = ((createdRows ?? []) as AuditRow[]).filter((r) => !deletedIds.has(r.target_id));

  const byType = new Map<LarkFileType, number>();
  const byDepartment = new Map<string, number>();
  for (const row of allRows) {
    const type = row.metadata?.fileType ?? "docx";
    byType.set(type, (byType.get(type) ?? 0) + 1);
    const dept = (row.actor_id && profileById.get(row.actor_id)?.department) || "(chưa gán)";
    byDepartment.set(dept, (byDepartment.get(dept) ?? 0) + 1);
  }

  const filteredRows = allRows.filter((row) => {
    if (q && !(row.metadata?.title ?? "").toLowerCase().includes(q)) return false;
    const creatorDept = row.actor_id ? profileById.get(row.actor_id)?.department : null;
    if (departmentFilter && creatorDept !== departmentFilter) return false;
    if (fileTypeFilter && (row.metadata?.fileType ?? "docx") !== fileTypeFilter) return false;
    return true;
  });

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE;
  const pageRows = filteredRows.slice(from, from + PAGE_SIZE);

  const qs = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ q: sp.q ?? "", phongBan: departmentFilter, loai: fileTypeFilter, ...overrides });
    for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
    const str = params.toString();
    return str ? `?${str}` : "";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link href="/admin/lark" className="w-fit text-sm font-medium text-accent hover:text-ink">
          ← Quay lại Tạo file Lark
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-medium">Tổng quan file Lark — toàn công ty</h1>
          <span className="text-sm text-ink-2">{allRows.length} file (chưa xoá)</span>
        </div>
        <p className="text-sm text-ink-2">
          Toàn bộ file do hệ thống tạo đều thuộc dung lượng lưu trữ của tổ chức 2SGROUP, bất kể nhân viên tạo file
          thuộc đơn vị nào.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-line bg-card p-4">
          <h2 className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Theo loại file</h2>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[])
              .filter((t) => (byType.get(t) ?? 0) > 0)
              .map((t) => (
                <div key={t} className="flex items-center justify-between text-sm">
                  <span className="text-ink-2">{LARK_FILE_TYPE_LABELS[t]}</span>
                  <span className="font-medium">{byType.get(t)}</span>
                </div>
              ))}
            {byType.size === 0 && <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>}
          </div>
        </div>
        <div className="rounded-card border border-line bg-card p-4">
          <h2 className="mb-2 text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Theo phòng ban</h2>
          <div className="flex flex-col gap-1.5">
            {[...byDepartment.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between text-sm">
                  <span className="text-ink-2">{departmentLabel(dept) ?? dept}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            {byDepartment.size === 0 && <p className="text-sm text-ink-2">Chưa có dữ liệu.</p>}
          </div>
        </div>
      </div>

      <form action="/admin/lark/quan-tri" method="get" className="flex flex-wrap gap-2.5">
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="Tìm theo tên file..."
          className="min-w-[200px] flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
        <select
          name="phongBan"
          defaultValue={departmentFilter}
          className="rounded-full border border-line bg-card px-4 py-2.5 text-[14.5px] text-ink outline-none"
        >
          <option value="">Tất cả phòng ban</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label}
            </option>
          ))}
        </select>
        <select
          name="loai"
          defaultValue={fileTypeFilter}
          className="rounded-full border border-line bg-card px-4 py-2.5 text-[14.5px] text-ink outline-none"
        >
          <option value="">Tất cả loại file</option>
          {(Object.keys(LARK_FILE_TYPE_LABELS) as LarkFileType[]).map((t) => (
            <option key={t} value={t}>
              {LARK_FILE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink"
        >
          Lọc
        </button>
        {(sp.q || departmentFilter || fileTypeFilter) && (
          <Link
            href="/admin/lark/quan-tri"
            className="flex items-center rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-ink-2">{total} kết quả</span>
      </div>

      {pageRows.length === 0 ? (
        <p className="text-sm text-ink-2">Không có file khớp bộ lọc.</p>
      ) : (
        <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-card">
          {pageRows.map((row) => {
            const creator = row.actor_id ? profileById.get(row.actor_id) : undefined;
            return (
              <div key={row.target_id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[14.5px] font-medium">
                      {row.metadata?.title ?? "(không có tiêu đề)"}
                    </span>
                    <span className="text-xs text-ink-2">
                      {LARK_FILE_TYPE_LABELS[row.metadata?.fileType ?? "docx"]} · {creator?.fullName ?? "—"} ·{" "}
                      {departmentLabel(creator?.department) ?? "chưa gán phòng ban"} ·{" "}
                      {new Date(row.created_at).toLocaleString("vi-VN")}
                    </span>
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
                {row.target_id && (
                  <DeleteLarkFileButton documentId={row.target_id} fileType={row.metadata?.fileType} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <Link
            href={`/admin/lark/quan-tri${qs({ trang: String(page - 1) })}`}
            aria-disabled={page <= 1}
            className={`text-sm font-medium ${page <= 1 ? "pointer-events-none text-ink-2 opacity-40" : "text-accent hover:text-ink"}`}
          >
            ← Trang trước
          </Link>
          <span className="text-sm text-ink-2">
            Trang {page} / {totalPages}
          </span>
          <Link
            href={`/admin/lark/quan-tri${qs({ trang: String(page + 1) })}`}
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
