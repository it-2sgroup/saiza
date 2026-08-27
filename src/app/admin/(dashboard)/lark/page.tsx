import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { departmentLabel } from "@/lib/admin/departments";
import { canManageStaff } from "@/lib/admin/permissions";
import { Avatar } from "../Avatar";
import { CreateFileModal } from "./CreateFileModal";
import { LarkSettingsModal } from "./LarkSettingsModal";
import { HistoryModal, type HistoryRow } from "./HistoryModal";
import { OverviewModal, type OverviewRow } from "./OverviewModal";
import { DashboardModal, type DashboardData, type CreatorStat } from "./DashboardModal";
import { ShareExistingDoc } from "./ShareExistingDoc";
import { DeleteLarkFileButton } from "./DeleteLarkFileButton";
import { MoveFileButton } from "./MoveFileButton";
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

  const isAdmin = canManageStaff(profile.role);
  const admin = createAdminClient();
  const orgKeys = ["", ...listConfiguredOrgs()];
  const [
    { data: ownRows },
    { data: allCreatedRows },
    { data: deletedRows },
    { data: profilesData },
    { data: usersData },
    folderTrees,
  ] = await Promise.all([
    admin
      .from("audit_log")
      .select("actor_id, target_id, metadata, created_at")
      .eq("action", "lark_doc_created")
      .eq("actor_id", profile.id)
      .order("created_at", { ascending: false }),
    isAdmin
      ? admin
          .from("audit_log")
          .select("actor_id, target_id, metadata, created_at")
          .eq("action", "lark_doc_created")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    admin.from("audit_log").select("target_id").eq("action", "lark_doc_deleted"),
    admin.from("profiles").select("id, full_name, department"),
    admin.auth.admin.listUsers(),
    Promise.all(
      orgKeys.map(async (org) => {
        const root = resolveRootFolderToken(org || null);
        return [org, root ? await listLarkFolderTree(root, org) : []] as [string, FolderOption[]];
      }),
    ),
  ]);

  const foldersByOrg: Record<string, FolderOption[]> = Object.fromEntries(folderTrees);
  const flatFolderOptions = [
    { value: "", label: "— Chọn thư mục —" },
    ...orgKeys.flatMap((org) => {
      const rootToken = resolveRootFolderToken(org || null);
      const orgLabel = org || "Dùng chung";
      const entries: { value: string; label: string }[] = [];
      if (rootToken) entries.push({ value: rootToken, label: `[${orgLabel}] — Thư mục gốc —` });
      for (const f of foldersByOrg[org] ?? []) {
        entries.push({ value: f.token, label: `[${orgLabel}] ${"　".repeat(f.depth - 1)}${f.name}` });
      }
      return entries;
    }),
  ];
  const deletedIds = new Set((deletedRows ?? []).map((r) => r.target_id));
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);
  const profileById = new Map(
    (profilesData ?? []).map((p) => [p.id as string, { fullName: p.full_name as string, department: p.department as string | null }]),
  );
  const staff: StaffOption[] = (profilesData ?? [])
    .map((p) => ({ id: p.id as string, full_name: p.full_name as string, email: emailById.get(p.id) ?? "" }))
    .filter((s): s is StaffOption => !!s.email);

  const ownAll = ((ownRows ?? []) as AuditRow[]).filter((r) => !deletedIds.has(r.target_id));
  const recentRows = ownAll.slice(0, 10);
  const historyRows: HistoryRow[] = ownAll
    .filter((r) => r.target_id)
    .map((r) => ({
      targetId: r.target_id as string,
      title: r.metadata?.title ?? "(không có tiêu đề)",
      url: r.metadata?.url ?? null,
      fileType: r.metadata?.fileType ?? "docx",
      createdAt: r.created_at,
    }));

  const overviewRows: OverviewRow[] = isAdmin
    ? ((allCreatedRows ?? []) as AuditRow[])
        .filter((r) => r.target_id && !deletedIds.has(r.target_id))
        .map((r) => {
          const creator = r.actor_id ? profileById.get(r.actor_id) : undefined;
          return {
            targetId: r.target_id as string,
            title: r.metadata?.title ?? "(không có tiêu đề)",
            url: r.metadata?.url ?? null,
            fileType: r.metadata?.fileType ?? "docx",
            createdAt: r.created_at,
            creatorName: creator?.fullName ?? "—",
            creatorDepartment: creator?.department ?? null,
          };
        })
    : [];

  const dashboardData: DashboardData | null = isAdmin
    ? (() => {
        const createdRows = ((allCreatedRows ?? []) as AuditRow[]).filter(
          (r) => r.target_id && !deletedIds.has(r.target_id),
        );
        // Server component: renders once per request, so Date.now() here is not a purity violation.
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        const DAY_MS = 24 * 60 * 60 * 1000;

        const statsByCreator = new Map<string, CreatorStat>();
        for (const row of createdRows) {
          if (!row.actor_id) continue;
          const info = profileById.get(row.actor_id);
          const existing = statsByCreator.get(row.actor_id);
          if (existing) {
            existing.count += 1;
            if (row.created_at > existing.lastCreatedAt) existing.lastCreatedAt = row.created_at;
          } else {
            statsByCreator.set(row.actor_id, {
              id: row.actor_id,
              fullName: info?.fullName ?? "—",
              department: info?.department ?? null,
              count: 1,
              lastCreatedAt: row.created_at,
            });
          }
        }

        const leaderboard = [...statsByCreator.values()].sort((a, b) => b.count - a.count);
        const allStaffList = profilesData ?? [];
        const neverCreated = allStaffList
          .filter((p) => !statsByCreator.has(p.id as string))
          .map((p) => ({ id: p.id as string, fullName: p.full_name as string, department: p.department as string | null }));

        const byType: Record<LarkFileType, number> = { docx: 0, sheet: 0, bitable: 0, folder: 0 };
        for (const row of createdRows) byType[row.metadata?.fileType ?? "docx"] += 1;

        const trend: { date: string; count: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          trend.push({ date: d.toISOString().slice(0, 10), count: 0 });
        }
        for (const row of createdRows) {
          const key = row.created_at.slice(0, 10);
          const day = trend.find((t) => t.date === key);
          if (day) day.count += 1;
        }

        // File đặt tên bắt đầu bằng "WIP_" mà đã tạo hơn 30 ngày — nhắc admin
        // theo dõi/finalize thay vì để rơi vào quên lãng.
        const staleWip = createdRows
          .filter((r) => (r.metadata?.title ?? "").startsWith("WIP_") && now - new Date(r.created_at).getTime() > 30 * DAY_MS)
          .map((r) => {
            const creator = r.actor_id ? profileById.get(r.actor_id) : undefined;
            return {
              targetId: r.target_id as string,
              title: r.metadata?.title ?? "(không có tiêu đề)",
              url: r.metadata?.url ?? null,
              creatorName: creator?.fullName ?? "—",
              createdAt: r.created_at,
            };
          })
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        return {
          totalStaff: allStaffList.length,
          activeCreators: statsByCreator.size,
          totalFiles: createdRows.length,
          filesLast7Days: createdRows.filter((r) => now - new Date(r.created_at).getTime() <= 7 * DAY_MS).length,
          filesLast30Days: createdRows.filter((r) => now - new Date(r.created_at).getTime() <= 30 * DAY_MS).length,
          byType,
          trend,
          leaderboard,
          neverCreated,
          staleWip,
        };
      })()
    : null;

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
          <LarkSettingsModal prefs={profile.lark_prefs} />
          {isAdmin && dashboardData && <DashboardModal data={dashboardData} />}
          {isAdmin && <OverviewModal rows={overviewRows} folderOptions={flatFolderOptions} />}
          <HistoryModal rows={historyRows} staff={staff} folderOptions={flatFolderOptions} />
        </div>
      </div>

      <CreateFileModal
        defaultDepartment={profile.department}
        staff={staff}
        foldersByOrg={foldersByOrg}
        prefs={profile.lark_prefs}
      />

      <div className="flex flex-col gap-2.5">
        <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-[0.06em]">File của bạn — gần đây</h2>
        {recentRows.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có tài liệu nào được tạo.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line rounded-card border border-line bg-card">
            {recentRows.map((row) => (
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
                    <div className="flex items-center gap-4">
                      <ShareExistingDoc documentId={row.target_id} fileType={row.metadata?.fileType} staff={staff} />
                      <MoveFileButton
                        documentId={row.target_id}
                        fileType={row.metadata?.fileType}
                        folderOptions={flatFolderOptions}
                      />
                    </div>
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
