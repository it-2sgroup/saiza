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
import { ItemActionsMenu } from "./ItemActionsMenu";
import { AppSwitcher } from "./AppSwitcher";
import { DriveExplorer } from "./DriveExplorer";
import { LarkTabs, LarkTabPanel } from "./LarkTabs";
import type { StaffOption } from "./StaffSharePicker";
import { DEFAULT_LARK_PREFS } from "@/lib/lark/prefs";
import { buildNamingSegments, todayYYYYMMDD } from "@/lib/admin/fileNaming";
import { NamingPreviewBox } from "./NamingPreviewBox";
import { StatTile } from "../StatTile";
import { LARK_FILE_TYPE_LABELS, getLarkApps, getDefaultAppKey, listTenantContacts, type LarkFileType } from "@/lib/lark/client";
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
      width="18"
      height="18"
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

const QUICK_CREATE_TYPES: { type: LarkFileType; label: string; badgeClassName: string }[] = [
  { type: "docx", label: "Docs", badgeClassName: "bg-blue-100 text-blue-600" },
  { type: "sheet", label: "Sheets", badgeClassName: "bg-green-100 text-green-600" },
  { type: "bitable", label: "Base", badgeClassName: "bg-purple-100 text-purple-600" },
  { type: "folder", label: "Thư mục", badgeClassName: "bg-amber-100 text-amber-600" },
];

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
  const [
    { data: ownRows },
    { data: allCreatedRows },
    { data: deletedRows },
    { data: profilesData },
    { data: usersData },
    folderTrees,
    tenantContactsByApp,
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
    admin.from("profiles").select("id, full_name, department, avatar_url"),
    admin.auth.admin.listUsers(),
    Promise.all(
      orgKeys.map(async (org) => {
        const root = resolveRootFolderToken(org || null, activeAppKey);
        return [org, root ? await listLarkFolderTree(root, org, activeAppKey) : []] as [string, FolderOption[]];
      }),
    ),
    // Sharing needs to reach people across ALL connected orgs, not just the
    // one currently active for new creations — merge every app's directory
    // into one suggestion pool instead of scoping it to activeAppKey.
    Promise.all(larkApps.map((a) => listTenantContacts(a.key).catch(() => []))),
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
  const websiteStaff: StaffOption[] = (profilesData ?? [])
    .map((p) => ({
      id: p.id as string,
      full_name: p.full_name as string,
      email: emailById.get(p.id) ?? "",
      avatar_url: p.avatar_url as string | null,
    }))
    .filter((s): s is StaffOption => !!s.email);
  // Sharing/transferring ownership needs to reach people across every
  // connected org, not just whichever app is active for new creations — so
  // the suggestion pool is every app's directory merged together (deduped by
  // email, since the same person can show up via more than one org).
  // Website staff fills in anyone still missing (e.g. contacts scope not
  // opened for their org yet).
  const seenEmails = new Set<string>();
  const tenantContacts: StaffOption[] = [];
  for (const contacts of tenantContactsByApp) {
    for (const c of contacts) {
      const key = c.email.toLowerCase();
      if (seenEmails.has(key)) continue;
      seenEmails.add(key);
      tenantContacts.push(c);
    }
  }
  const staff: StaffOption[] = [...tenantContacts, ...websiteStaff.filter((s) => !seenEmails.has(s.email.toLowerCase()))];

  // Rows created before multi-app support existed never recorded an appKey —
  // treat those as belonging to the original (default) app so switching apps
  // actually changes what's shown instead of always mixing every app's files.
  const belongsToActiveApp = (r: AuditRow) => (r.metadata?.appKey ?? getDefaultAppKey()) === activeAppKey;

  const ownAll = ((ownRows ?? []) as AuditRow[]).filter((r) => !deletedIds.has(r.target_id) && belongsToActiveApp(r));
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

  const namingPrefs = { ...DEFAULT_LARK_PREFS, ...profile.lark_prefs };
  const namingParts = [
    namingPrefs.includeDept && "Mã phòng ban",
    namingPrefs.includeDocType && "Loại tài liệu",
    namingPrefs.includeDate && "Ngày tạo",
    namingPrefs.includeVersion && "Version",
  ].filter(Boolean) as string[];
  const namingSegments = buildNamingSegments(namingPrefs, profile.department, todayYYYYMMDD());

  // Server component: renders once per request, so Date.now() here is not a purity violation.
  // eslint-disable-next-line react-hooks/purity
  const nowTs = Date.now();
  const ownLast7Days = historyRows.filter((r) => nowTs - new Date(r.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const adoptionPct =
    dashboardData && dashboardData.totalStaff > 0 ? Math.round((dashboardData.activeCreators / dashboardData.totalStaff) * 100) : 0;

  const overviewTab = (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isAdmin && (
          <StatTile
            label="File toàn công ty"
            value={overviewRows.length}
            sub={`trong ${larkApps.find((a) => a.key === activeAppKey)?.label ?? activeAppKey}`}
          />
        )}
        <StatTile label="File của bạn" value={historyRows.length} />
        {isAdmin && dashboardData ? (
          <>
            <StatTile
              label="Nhân viên dùng"
              value={`${dashboardData.activeCreators}/${dashboardData.totalStaff}`}
              sub={`${adoptionPct}%`}
            />
            <StatTile label="7 ngày qua" value={dashboardData.filesLast7Days} sub={`30 ngày: ${dashboardData.filesLast30Days}`} />
          </>
        ) : (
          <StatTile label="7 ngày qua" value={ownLast7Days} />
        )}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Tạo nhanh</span>
            {QUICK_CREATE_TYPES.map((t) => (
              <CreateFileModal
                key={t.type}
                defaultDepartment={profile.department}
                staff={staff}
                foldersByOrg={foldersByOrg}
                prefs={profile.lark_prefs}
                initialType={t.type}
                trigger={
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-accent hover:text-accent"
                  >
                    <span className={`h-2 w-2 rounded-full ${t.badgeClassName}`} />
                    {t.label}
                  </button>
                }
              />
            ))}
          </div>

          <div className="flex flex-col gap-2.5 rounded-card border border-line bg-card p-4">
            <h3 className="text-sm font-semibold text-ink">Tiếp tục làm việc</h3>
            {historyRows.length === 0 ? (
              <p className="text-sm text-ink-2">Chưa có tài liệu nào được tạo.</p>
            ) : (
              <div className="flex flex-col divide-y divide-line">
                {historyRows.slice(0, 8).map((row) => (
                  <div key={row.targetId} className="flex items-center gap-3 py-2.5">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-wash text-accent-2">
                      <FileTypeIcon type={row.fileType} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[14.5px] font-medium">{row.title}</span>
                      <span className="text-xs text-ink-2">
                        {LARK_FILE_TYPE_LABELS[row.fileType]} · {profile.full_name} · {departmentLabel(profile.department) ?? "(chưa gán)"}
                      </span>
                    </div>
                    <span className="flex-shrink-0 text-xs whitespace-nowrap text-ink-2">
                      {new Date(row.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <ItemActionsMenu
                      documentId={row.targetId}
                      fileType={row.fileType}
                      url={row.url}
                      staff={staff}
                      folderOptions={flatFolderOptions}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[280px] lg:flex-shrink-0">
          <div className="flex flex-col gap-2.5 rounded-card border border-line bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">Quy ước đặt tên</h3>
              <LarkSettingsModal
                prefs={profile.lark_prefs}
                department={profile.department}
                trigger={
                  <button type="button" className="cursor-pointer text-xs font-medium text-accent hover:text-ink">
                    Sửa
                  </button>
                }
              />
            </div>
            <NamingPreviewBox segments={namingSegments} />
            {namingParts.length === 0 ? (
              <p className="text-sm text-ink-2">Chưa bật thành phần nào — tên file sẽ chỉ gồm tiêu đề bạn nhập.</p>
            ) : (
              <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                {namingParts.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-ink-2">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isAdmin && dashboardData && (
            <div className="flex flex-col gap-1 rounded-card border border-line bg-paper p-4">
              <span className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Nhân viên dùng hệ thống</span>
              <span className="text-2xl font-semibold text-ink">
                {dashboardData.activeCreators}/{dashboardData.totalStaff}
              </span>
              <span className="text-xs text-ink-2">{adoptionPct}% đã tạo ít nhất 1 file</span>
              {dashboardData.neverCreated.length > 0 && (
                <span className="text-xs text-ink-2">{dashboardData.neverCreated.length} người chưa dùng</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const mineTab = (
    <HistoryModal
      inline
      rows={historyRows}
      staff={staff}
      folderOptions={flatFolderOptions}
      creatorName={profile.full_name}
      creatorDepartment={profile.department}
    />
  );

  const driveTab = (
    <DriveExplorer inline appKey={activeAppKey} appLabel={larkApps.find((a) => a.key === activeAppKey)?.label ?? activeAppKey} />
  );

  const statsTab = isAdmin ? (
    <div className="flex flex-col gap-6">
      {dashboardData && <DashboardModal inline data={dashboardData} />}
      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-sm font-semibold tracking-[0.06em] text-ink-2 uppercase">Toàn bộ file công ty</h2>
        <OverviewModal inline rows={overviewRows} folderOptions={flatFolderOptions} staff={staff} />
      </div>
    </div>
  ) : null;

  return (
    <div className="flex w-full flex-col gap-6 font-[family-name:var(--font-ibm-plex-sans)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar fullName={profile.full_name} avatarUrl={profile.avatar_url} size={9} />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium">Tạo file Lark</h1>
              <span className="rounded-full bg-wash px-2.5 py-0.5 text-xs font-semibold text-ink-2">{historyRows.length} file</span>
            </div>
            <span className="text-xs text-ink-2">
              {profile.full_name} · {departmentLabel(profile.department) ?? "chưa gán phòng ban"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppSwitcher apps={larkApps.map((a) => ({ key: a.key, label: a.label }))} activeKey={activeAppKey} />
          <CreateFileModal defaultDepartment={profile.department} staff={staff} foldersByOrg={foldersByOrg} prefs={profile.lark_prefs} />
          <LarkSettingsModal prefs={profile.lark_prefs} department={profile.department} />
        </div>
      </div>

      <LarkTabs>
        <LarkTabPanel key="overview" label="Tổng quan">
          {overviewTab}
        </LarkTabPanel>
        <LarkTabPanel key="mine" label="File của tôi">
          {mineTab}
        </LarkTabPanel>
        <LarkTabPanel key="drive" label="Drive">
          {driveTab}
        </LarkTabPanel>
        {isAdmin && (
          <LarkTabPanel key="stats" label="Thống kê">
            {statsTab}
          </LarkTabPanel>
        )}
      </LarkTabs>
    </div>
  );
}
