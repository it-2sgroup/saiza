import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { departmentLabel } from "@/lib/admin/departments";
import { canManageStaff } from "@/lib/admin/permissions";
import { Avatar } from "../Avatar";
import { LarkDocForm } from "./LarkDocForm";
import { ShareExistingDoc } from "./ShareExistingDoc";
import { DeleteLarkFileButton } from "./DeleteLarkFileButton";
import type { StaffOption } from "./StaffSharePicker";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/client";
import { listLarkFolderTree, type FolderOption } from "@/lib/lark/folders";
import { resolveRootFolderToken, listConfiguredOrgs } from "@/lib/lark/orgFolders";

type AuditRow = {
  actor_id: string | null;
  target_id: string | null;
  metadata: { title?: string; url?: string; shared?: boolean; fileType?: LarkFileType } | null;
  created_at: string;
};

export default async function AdminLarkPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const admin = createAdminClient();
  const orgKeys = ["", ...listConfiguredOrgs()];
  const [{ data: logRows }, { data: deletedRows }, { data: profilesData }, { data: usersData }, folderTrees] =
    await Promise.all([
      admin
        .from("audit_log")
        .select("actor_id, target_id, metadata, created_at")
        .eq("action", "lark_doc_created")
        .eq("actor_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10),
      admin.from("audit_log").select("target_id").eq("action", "lark_doc_deleted"),
      admin.from("profiles").select("id, full_name"),
      admin.auth.admin.listUsers(),
      Promise.all(
        orgKeys.map(async (org) => {
          const root = resolveRootFolderToken(org || null);
          return [org, root ? await listLarkFolderTree(root) : []] as [string, FolderOption[]];
        }),
      ),
    ]);

  const foldersByOrg: Record<string, FolderOption[]> = Object.fromEntries(folderTrees);

  const deletedIds = new Set((deletedRows ?? []).map((r) => r.target_id));
  const rows = ((logRows ?? []) as AuditRow[]).filter((r) => !deletedIds.has(r.target_id));
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);
  const staff: StaffOption[] = (profilesData ?? [])
    .map((p) => ({ id: p.id as string, full_name: p.full_name as string, email: emailById.get(p.id) ?? "" }))
    .filter((s): s is StaffOption => !!s.email);

  return (
    <div className="flex w-full flex-col gap-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar fullName={profile.full_name} avatarUrl={profile.avatar_url} size={9} />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-medium">Tạo file Lark</h1>
            <span className="text-xs text-ink-2">
              {profile.full_name} · {departmentLabel(profile.department) ?? "chưa gán phòng ban"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManageStaff(profile.role) && (
            <Link
              href="/admin/lark/quan-tri"
              title="Tổng quan toàn công ty"
              aria-label="Tổng quan toàn công ty"
              className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </Link>
          )}
          <Link
            href="/admin/lark/lich-su"
            title="Lịch sử tạo file của tôi"
            aria-label="Lịch sử tạo file của tôi"
            className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M9 13h6M9 17h6" />
            </svg>
          </Link>
        </div>
      </div>

      <LarkDocForm defaultDepartment={profile.department} staff={staff} foldersByOrg={foldersByOrg} />

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-[0.06em]">File của bạn — gần đây</h2>
          <Link href="/admin/lark/lich-su" className="text-sm font-medium text-accent hover:text-ink">
            Xem tất cả →
          </Link>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có tài liệu nào được tạo.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-card">
            {rows.map((row) => (
              <div key={row.target_id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[14.5px] font-medium">
                      {row.metadata?.title ?? "(không có tiêu đề)"}
                    </span>
                    <span className="text-xs text-ink-2">
                      {LARK_FILE_TYPE_LABELS[row.metadata?.fileType ?? "docx"]} ·{" "}
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
                  <div className="flex items-center justify-between gap-4">
                    <ShareExistingDoc documentId={row.target_id} fileType={row.metadata?.fileType} staff={staff} />
                    <DeleteLarkFileButton documentId={row.target_id} fileType={row.metadata?.fileType} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
