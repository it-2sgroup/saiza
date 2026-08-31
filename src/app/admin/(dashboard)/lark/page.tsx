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
import { TransferOwnerButton } from "./TransferOwnerButton";
import { AppSwitcher } from "./AppSwitcher";
import { DriveExplorer } from "./DriveExplorer";
import type { StaffOption } from "./StaffSharePicker";
import { LARK_FILE_TYPE_LABELS, getLarkApps, getDefaultAppKey, type LarkFileType } from "@/lib/lark/client";
import { listLarkFolderTree, type FolderOption } from "@/lib/lark/folders";
import { resolveRootFolderToken, listConfiguredOrgs } from "@/lib/lark/orgFolders";

const FILE_TYPE_ICON_PATHS: Record<LarkFileType, React.ReactNode> = {
  docx: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </>
  ),
  sheet: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
  bitable: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </>
  ),
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
};

function FileTypeIcon({ type }: { type: LarkFileType }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {FILE_TYPE_ICON_PATHS[type]}
    </svg>
  );
}

type FileCardRow = {
  target_id: string | null;
  metadata: { title?: string; url?: string; fileType?: LarkFileType } | null;
  created_at: string;
};

function FileCard({
  row,
  staff,
  flatFolderOptions,
}: {
  row: FileCardRow;
  staff: StaffOption[];
  flatFolderOptions: { value: string; label: string }[];
}) {
  const fileType = row.metadata?.fileType ?? "docx";
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-card transition-shadow duration-300 ease-soft hover:shadow-[0_8px_24px_rgba(30,27,75,0.10)]">
      <div className="flex h-20 flex-shrink-0 items-center justify-center bg-wash text-accent-2">
        <FileTypeIcon type={fileType} />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="line-clamp-2 text-[14.5px] font-semibold">{row.metadata?.title ?? "(không có tiêu đề)"}</span>
          <span className="text-xs text-ink-2">
            {LARK_FILE_TYPE_LABELS[fileType]} · {new Date(row.created_at).toLocaleString("vi-VN")}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
          {row.metadata?.url && (
            <a
              href={row.metadata.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-accent hover:text-accent"
            >
              Mở
            </a>
          )}
          {row.target_id && (
            <>
              <ShareExistingDoc documentId={row.target_id} fileType={fileType} staff={staff} variant="button" />
              <MoveFileButton documentId={row.target_id} fileType={fileType} folderOptions={flatFolderOptions} variant="button" />
              <TransferOwnerButton documentId={row.target_id} fileType={fileType} staff={staff} variant="button" />
              <DeleteLarkFileButton documentId={row.target_id} fileType={fileType} variant="button" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type AuditRow = {
  actor_id: string | null;
  target_id: string | null;
  metadata: { title?: string; url?: string; shared?: boolean; fileType?: LarkFileType; appKey?: string } | null;
  created_at: string;
};

export default async function AdminLarkPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const isAdmin = canManageStaff(profile.role);
  const admin = createAdminClient();
  const larkApps = getLarkApps();
  const activeAppKey = profile.lark_prefs.activeApp || getDefaultAppKey();
  const orgKeys = ["", ...listConfiguredOrgs(activeAppKey)];
  const [{ data: ownRows }, { data: allCreatedRows }, { data: deletedRows }, { data: profilesData }, { data: usersData }, folderTrees] =
    await Promise.all([
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
          const root = resolveRootFolderToken(org || null, activeAppKey);
          return [org, root ? await listLarkFolderTree(root, org, activeAppKey) : []] as [string, FolderOption[]];
        }),
      ),
    ]);

  const foldersByOrg: Record<string, FolderOption[]> = Object.fromEntries(folderTrees);
  const flatFolderOptions = [
    { value: "", label: "— Chọn thư mục —" },
    ...orgKeys.flatMap((org) => {
      const rootToken = resolveRootFolderToken(org || null, activeAppKey);
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

  // Rows created before multi-app support existed never recorded an appKey —
  // treat those as belonging to the original (default) app so switching apps
  // actually changes what's shown instead of always mixing every app's files.
  const belongsToActiveApp = (r: AuditRow) => (r.metadata?.appKey ?? getDefaultAppKey()) === activeAppKey;

  const ownAll = ((ownRows ?? []) as AuditRow[]).filter((r) => !deletedIds.has(r.target_id) && belongsToActiveApp(r));
  const recentRows = ownAll.slice(0, 10);
  const recentFolders = recentRows.filter((r) => r.metadata?.fileType === "folder");
  const recentFiles = recentRows.filter((r) => r.metadata?.fileType !== "folder");
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
        .filter((r) => r.target_id && !deletedIds.has(r.target_id) && belongsToActiveApp(r))
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
          (r) => r.target_id && !deletedIds.has(r.target_id) && belongsToActiveApp(r),
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar fullName={profile.full_name} avatarUrl={profile.avatar_url} size={9} />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-medium">Tạo file Lark</h1>
            <span className="text-xs text-ink-2">
              {profile.full_name} · {departmentLabel(profile.department) ?? "chưa gán phòng ban"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppSwitcher apps={larkApps.map((a) => ({ key: a.key, label: a.label }))} activeKey={activeAppKey} />
          <DriveExplorer appKey={activeAppKey} appLabel={larkApps.find((a) => a.key === activeAppKey)?.label ?? activeAppKey} />
          <CreateFileModal defaultDepartment={profile.department} staff={staff} foldersByOrg={foldersByOrg} prefs={profile.lark_prefs} />
          <LarkSettingsModal prefs={profile.lark_prefs} />
          {isAdmin && dashboardData && <DashboardModal data={dashboardData} />}
          {isAdmin && <OverviewModal rows={overviewRows} folderOptions={flatFolderOptions} staff={staff} />}
          <HistoryModal rows={historyRows} staff={staff} folderOptions={flatFolderOptions} />
        </div>
      </div>

      {recentRows.length === 0 ? (
        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-[0.06em]">File của bạn — gần đây</h2>
          <p className="text-sm text-ink-2">Chưa có tài liệu nào được tạo.</p>
        </div>
      ) : (
        <>
          {recentFolders.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-[0.06em]">Thư mục của bạn — gần đây</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentFolders.map((row) => (
                  <FileCard key={row.target_id} row={row} staff={staff} flatFolderOptions={flatFolderOptions} />
                ))}
              </div>
            </div>
          )}
          {recentFiles.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-[0.06em]">Tài liệu của bạn — gần đây</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentFiles.map((row) => (
                  <FileCard key={row.target_id} row={row} staff={staff} flatFolderOptions={flatFolderOptions} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
