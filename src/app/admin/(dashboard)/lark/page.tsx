import { getCurrentProfile } from "@/lib/supabase/profile";
import { canAccessLark } from "@/lib/admin/permissions";
import { resolveConfigLabel } from "@/lib/admin/configLists";
import { Avatar } from "../Avatar";
import { CreateFileModal } from "./CreateFileModal";
import { LarkSettingsModal } from "./LarkSettingsModal";
import { NamingPreviewBox } from "./NamingPreviewBox";
import { HistoryModal } from "./HistoryModal";
import { OverviewModal } from "./OverviewModal";
import { DashboardModal, DonutCard } from "./DashboardModal";
import { ADOPTION_COLORS } from "./chartColors";
import { AppSwitcher } from "./AppSwitcher";
import { DriveExplorer } from "./DriveExplorer";
import { LarkTabs, LarkTabPanel } from "./LarkTabs";
import { LarkRealtimeSync } from "./LarkRealtimeSync";
import { RecentFilesList } from "./RecentFilesList";
import { TrashTab } from "./TrashTab";
import { StatTile } from "../StatTile";
import { Btn, cardClasses } from "../controls";
import { countNoun, type LarkFileType } from "@/lib/lark/fileTypes";
import { getLarkPageData } from "./data";

const NAMING_PARTS: {
  key: "includeDept" | "includeDocType" | "includeDate" | "includeVersion";
  label: string;
}[] = [
  { key: "includeDept", label: "Phòng ban" },
  { key: "includeDocType", label: "Loại tài liệu" },
  { key: "includeDate", label: "Ngày" },
  { key: "includeVersion", label: "Version" },
];

const QUICK_CREATE_TYPES: {
  type: LarkFileType;
  label: string;
  badgeClassName: string;
}[] = [
  { type: "docx", label: "Docs", badgeClassName: "bg-blue-500" },
  { type: "sheet", label: "Sheets", badgeClassName: "bg-green-500" },
  { type: "bitable", label: "Base", badgeClassName: "bg-purple-500" },
  { type: "folder", label: "Thư mục", badgeClassName: "bg-amber-500" },
];

export default async function AdminLarkPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }
  if (!(await canAccessLark(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const {
    isAdmin,
    larkApps,
    activeAppKey,
    foldersByOrg,
    createFoldersByOrg,
    flatFolderOptions,
    staff,
    historyRows,
    overviewRows,
    trashRows,
    dashboardData,
    driveRootItems,
    namingPrefs,
    namingSegments,
    ownLast7Days,
    adoptionPct,
    departments,
    orgCodes,
    docTypes,
  } = await getLarkPageData(profile);

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
            <StatTile
              label="7 ngày qua"
              value={dashboardData.filesLast7Days}
              sub={`30 ngày: ${dashboardData.filesLast30Days}`}
            />
          </>
        ) : (
          <StatTile label="7 ngày qua" value={ownLast7Days} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {QUICK_CREATE_TYPES.map((t) => (
          <CreateFileModal
            key={t.type}
            defaultDepartment={profile.department}
            staff={staff}
            foldersByOrg={createFoldersByOrg}
            prefs={profile.lark_prefs}
            initialType={t.type}
            departments={departments}
            orgCodes={orgCodes}
            docTypes={docTypes}
            trigger={
              <Btn size="sm">
                <span className={`h-2 w-2 rounded-full ${t.badgeClassName}`} />
                {t.label}
              </Btn>
            }
          />
        ))}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <div className={`flex flex-col gap-2.5 ${cardClasses} p-4`}>
            <h3 className="text-sm font-semibold text-ink">
              Tiếp tục làm việc
            </h3>
            <RecentFilesList
              rows={historyRows}
              staff={staff}
              folderOptions={flatFolderOptions}
              creatorName={profile.full_name}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[400px] lg:flex-shrink-0">
          <div className={`flex flex-col gap-3.5 ${cardClasses} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink">
                Quy ước đặt tên
              </h3>
              <LarkSettingsModal
                prefs={profile.lark_prefs}
                department={profile.department}
                departments={departments}
                orgCodes={orgCodes}
                docTypes={docTypes}
                trigger={<Btn size="sm">Sửa</Btn>}
              />
            </div>
            <NamingPreviewBox segments={namingSegments} />
            {/* Only the parts actually switched on, as plain chips. This was a
                4-row list of check-boxes that looked interactive but weren't,
                each spelling out "— đang tắt" for the ones that were off —
                a lot of words to say something the preview above already
                shows at a glance. */}
            <div className="flex flex-wrap gap-1.5">
              {NAMING_PARTS.filter((p) => namingPrefs[p.key]).map((p) => (
                <span
                  key={p.key}
                  className="rounded-md bg-wash px-2 py-1 text-xs font-medium text-ink-2"
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          {isAdmin && dashboardData && (
            <DonutCard
              title="Nhân viên dùng hệ thống"
              data={[
                {
                  name: "Đã tạo file",
                  value: dashboardData.activeCreators,
                  color: ADOPTION_COLORS.active,
                },
                {
                  name: "Chưa tạo file",
                  value:
                    dashboardData.totalStaff - dashboardData.activeCreators,
                  color: ADOPTION_COLORS.inactive,
                },
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
      departments={departments}
    />
  );

  const driveTab = (
    <DriveExplorer
      key={activeAppKey}
      inline
      appKey={activeAppKey}
      appLabel={
        larkApps.find((a) => a.key === activeAppKey)?.label ?? activeAppKey
      }
      cacheScope={profile.id}
      folderTree={foldersByOrg[""] ?? []}
      initialItems={driveRootItems}
      staff={staff}
      folderOptions={flatFolderOptions}
    />
  );

  const trashTab = <TrashTab rows={trashRows} />;

  const statsTab = isAdmin ? (
    <div className="flex flex-col gap-6">
      {dashboardData && (
        <DashboardModal inline data={dashboardData} departments={departments} />
      )}
      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <h2 className="text-sm font-semibold tracking-[0.06em] text-ink-2 uppercase">
          Toàn bộ file công ty
        </h2>
        <OverviewModal
          inline
          rows={overviewRows}
          folderOptions={flatFolderOptions}
          staff={staff}
          departments={departments}
        />
      </div>
    </div>
  ) : null;

  return (
    <div className="lark-theme flex w-full flex-col gap-6">
      <LarkRealtimeSync appKey={activeAppKey} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            size={9}
          />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium">Tạo file Lark</h1>
              <span className="rounded-full bg-wash px-2.5 py-0.5 text-xs font-semibold text-ink-2">
                {historyRows.length}{" "}
                {countNoun(historyRows.map((r) => r.fileType))}
              </span>
            </div>
            <span className="text-xs text-ink-2">
              {profile.full_name} ·{" "}
              {resolveConfigLabel(profile.department, departments) ??
                "chưa gán phòng ban"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppSwitcher
            apps={larkApps.map((a) => ({ key: a.key, label: a.label }))}
            activeKey={activeAppKey}
          />
          <CreateFileModal
            defaultDepartment={profile.department}
            staff={staff}
            foldersByOrg={createFoldersByOrg}
            prefs={profile.lark_prefs}
            departments={departments}
            orgCodes={orgCodes}
            docTypes={docTypes}
          />
          <LarkSettingsModal
            prefs={profile.lark_prefs}
            department={profile.department}
            departments={departments}
            orgCodes={orgCodes}
            docTypes={docTypes}
          />
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
        <LarkTabPanel
          key="trash"
          label={`Thùng rác${trashRows.length > 0 ? ` (${trashRows.length})` : ""}`}
        >
          {trashTab}
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
