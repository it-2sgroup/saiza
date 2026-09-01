import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { departmentLabel } from "@/lib/admin/departments";
import { canManageStaff } from "@/lib/admin/permissions";
import { Avatar } from "../Avatar";
import { CreateFileModal } from "./CreateFileModal";
import { LarkSettingsModal } from "./LarkSettingsModal";
import { NamingPreviewBox } from "./NamingPreviewBox";
import { HistoryModal, type HistoryRow } from "./HistoryModal";
import { OverviewModal, type OverviewRow } from "./OverviewModal";
import { DashboardModal, DonutCard, type DashboardData, type CreatorStat } from "./DashboardModal";
import { ADOPTION_COLORS } from "./chartColors";
import { ItemActionsMenu } from "./ItemActionsMenu";
import { AppSwitcher } from "./AppSwitcher";
import { DriveExplorer } from "./DriveExplorer";
import { LarkTabs, LarkTabPanel } from "./LarkTabs";
import { TypeBadge } from "./TypeBadge";
import type { StaffOption } from "./StaffSharePicker";
import { StatTile } from "../StatTile";
import {
  LARK_FILE_TYPE_LABELS,
  getLarkApps,
  getDefaultAppKey,
  listTenantContacts,
  getAppRootFolderToken,
  listFolderContents,
  type LarkFileType,
  type LarkDriveItem,
} from "@/lib/lark/client";
import { listLarkFolderTree, type FolderOption } from "@/lib/lark/folders";
import { resolveRootFolderToken, listConfiguredOrgs } from "@/lib/lark/orgFolders";
import { DEFAULT_LARK_PREFS } from "@/lib/lark/prefs";
import { buildNamingSegments, todayYYYYMMDD } from "@/lib/admin/fileNaming";

const NAMING_CHECKLIST: { key: "includeDept" | "includeDocType" | "includeDate" | "includeVersion"; label: string }[] = [
  { key: "includeDept", label: "Mã phòng ban" },
  { key: "includeDocType", label: "Loại tài liệu" },
  { key: "includeDate", label: "Ngày tạo" },
  { key: "includeVersion", label: "Version" },
];

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
    driveRootItems,
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
    // Pre-fetch the Drive tab's root listing server-side so it renders with
    // content immediately instead of showing "Đang tải..." on every visit —
    // best-effort: a Drive API hiccup here shouldn't break the whole page.
    (async (): Promise<LarkDriveItem[] | undefined> => {
      try {
        const rootToken = await getAppRootFolderToken(activeAppKey);
        return await listFolderContents(rootToken, activeAppKey);
      } catch {
        return undefined;
      }
    })(),
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

  // Server component: renders once per request, so Date.now() here is not a purity violation.
  // eslint-disable-next-line react-hooks/purity
  const nowTs = Date.now();
  const ownLast7Days = historyRows.filter((r) => nowTs - new Date(r.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const adoptionPct =
    dashboardData && dashboardData.totalStaff > 0 ? Math.round((dashboardData.activeCreators / dashboardData.totalStaff) * 100) : 0;

  const namingPrefs = { ...DEFAULT_LARK_PREFS, ...profile.lark_prefs };
  const namingSegments = buildNamingSegments(namingPrefs, profile.department, todayYYYYMMDD());

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
                    <TypeBadge type={row.fileType} />
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

        <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:flex-shrink-0">
          <div className="flex flex-col gap-4 rounded-card border border-line bg-card p-4">
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
            <ul className="flex flex-col gap-2.5">
              {NAMING_CHECKLIST.map((item) => {
                const on = namingPrefs[item.key];
                return (
                  <li key={item.key} className="flex items-center gap-2.5 text-[13.5px]">
                    <span
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[4px] ${
                        on ? "bg-ink text-white" : "border border-line text-line"
                      }`}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <span className={on ? "text-ink" : "text-ink-2/60"}>
                      {item.label}
                      {!on && " — đang tắt"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {isAdmin && dashboardData && (
            <DonutCard
              title="Nhân viên dùng hệ thống"
              data={[
                { name: "Đã tạo file", value: dashboardData.activeCreators, color: ADOPTION_COLORS.active },
                { name: "Chưa tạo file", value: dashboardData.totalStaff - dashboardData.activeCreators, color: ADOPTION_COLORS.inactive },
              ]}
            />
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
    <DriveExplorer
      key={activeAppKey}
      inline
      appKey={activeAppKey}
      appLabel={larkApps.find((a) => a.key === activeAppKey)?.label ?? activeAppKey}
      folderTree={foldersByOrg[""] ?? []}
      initialItems={driveRootItems}
    />
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
    <div className="lark-theme flex w-full flex-col gap-6 font-[family-name:var(--font-ibm-plex-sans)]">
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
