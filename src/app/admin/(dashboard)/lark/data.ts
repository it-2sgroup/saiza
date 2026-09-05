import "server-only";
import type { Profile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageStaff } from "@/lib/admin/permissions";
import type { HistoryRow } from "./HistoryModal";
import type { OverviewRow } from "./OverviewModal";
import type { DashboardData, CreatorStat } from "./DashboardModal";
import type { StaffOption } from "./StaffSharePicker";
import { getLarkApps, getDefaultAppKey, getAppRootFolderToken, type LarkFileType, type LarkDriveItem } from "@/lib/lark/client";
import { listLarkFolderTree, addFoldersToCache, type FolderOption } from "@/lib/lark/folders";
import { listTenantContactsCached } from "@/lib/lark/contactsCache";
import { listFolderContentsCached } from "@/lib/lark/driveCache";
import { listTrashRows, purgeExpiredTrash, getTrashFolderTokenIfExists } from "@/lib/lark/trash";
import { resolveRootFolderToken, listConfiguredOrgs } from "@/lib/lark/orgFolders";
import { DEFAULT_LARK_PREFS } from "@/lib/lark/prefs";
import { buildNamingSegments, todayYYYYMMDD, type NamingSegment } from "@/lib/admin/fileNaming";

type AuditRow = {
  actor_id: string | null;
  target_id: string | null;
  metadata: {
    title?: string;
    url?: string;
    shared?: boolean;
    fileType?: LarkFileType;
    appKey?: string;
    targetFolder?: string | null;
  } | null;
  created_at: string;
};

export type TrashUiRow = {
  documentId: string;
  fileType: LarkFileType;
  title: string;
  originalFolderName: string;
  deletedByName: string;
  deletedAt: string;
  purgeAt: string;
  // Whether the current viewer may restore/permanently-delete this row —
  // the deleter, or an admin. Precomputed here (not re-derived in the UI)
  // since it depends on data.ts's own isAdmin/profile.id, not anything the
  // client component should be trusted to decide for itself.
  canManage: boolean;
};

export type LarkPageData = {
  isAdmin: boolean;
  larkApps: { key: string; label: string }[];
  activeAppKey: string;
  foldersByOrg: Record<string, FolderOption[]>;
  flatFolderOptions: { value: string; label: string }[];
  staff: StaffOption[];
  historyRows: HistoryRow[];
  overviewRows: OverviewRow[];
  trashRows: TrashUiRow[];
  dashboardData: DashboardData | null;
  driveRootItems: LarkDriveItem[] | undefined;
  namingPrefs: typeof DEFAULT_LARK_PREFS & Profile["lark_prefs"];
  namingSegments: NamingSegment[];
  ownLast7Days: number;
  adoptionPct: number;
};

// Everything the "Tạo file Lark" page needs, fetched and shaped once. Kept
// separate from page.tsx so the data layer (audit-log queries, folder-tree/
// cache building, per-file folder-name resolution, dashboard analytics) can
// be read and changed independently of the page's JSX composition.
export async function getLarkPageData(profile: Profile): Promise<LarkPageData> {
  const isAdmin = canManageStaff(profile.role);
  const admin = createAdminClient();
  const larkApps = getLarkApps();
  const activeAppKey = profile.lark_prefs.activeApp || getDefaultAppKey();
  const orgKeys = ["", ...listConfiguredOrgs(activeAppKey)];

  // Best-effort, debounced retention sweep for this app's trash — see
  // purgeExpiredTrash's own doc comment for why this is "opportunistic on
  // page load" rather than a real cron.
  purgeExpiredTrash(activeAppKey);

  const [
    { data: ownRows },
    { data: allCreatedRows },
    trashRowsRaw,
    { data: movedRows },
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
    // The trash table itself, not audit_log, is the source of truth for
    // "is this currently deleted" — a restore has to be able to un-hide an
    // item, which a write-once, ever-growing action log can't cleanly do
    // without also reasoning about event ordering.
    listTrashRows(activeAppKey),
    // Newest-first so the folder a file currently lives in is whichever move
    // (or creation, if never moved) has the most recent timestamp per target.
    admin
      .from("audit_log")
      .select("target_id, metadata, created_at")
      .eq("action", "lark_doc_moved")
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("id, full_name, department, avatar_url"),
    admin.auth.admin.listUsers(),
    Promise.all(
      orgKeys.map(async (org) => {
        // resolveRootFolderToken is sync and only knows about explicitly
        // configured org roots — for the default ("") org, fall back to the
        // app's real My Space root (same live-API lookup the Drive tab
        // already uses via getAppRootFolderToken), or this org's folder tree
        // silently stays empty forever for apps that never set docFolderToken.
        const root =
          resolveRootFolderToken(org || null, activeAppKey) || (org === "" ? await getAppRootFolderToken(activeAppKey) : undefined);
        return [org, root, root ? await listLarkFolderTree(root, org, activeAppKey) : []] as [string, string | undefined, FolderOption[]];
      }),
    ),
    // Sharing needs to reach people across ALL connected orgs, not just the
    // one currently active for new creations — merge every app's directory
    // into one suggestion pool instead of scoping it to activeAppKey.
    Promise.all(larkApps.map((a) => listTenantContactsCached(a.key).catch(() => []))),
    // Pre-fetch the Drive tab's root listing server-side so it renders with
    // content immediately instead of showing "Đang tải..." on every visit —
    // best-effort: a Drive API hiccup here shouldn't break the whole page.
    (async (): Promise<LarkDriveItem[] | undefined> => {
      try {
        const rootToken = await getAppRootFolderToken(activeAppKey);
        const rawItems = await listFolderContentsCached(rootToken, activeAppKey);
        // Never surface the trash folder outside the dedicated Trash tab.
        const trashFolderToken = await getTrashFolderTokenIfExists(activeAppKey);
        const items = trashFolderToken ? rawItems.filter((i) => i.token !== trashFolderToken) : rawItems;
        // Same write-through as browseLarkFolder (actions.ts) — keeps the
        // Move/Create-file folder picker's cache warm on every page load,
        // not just when someone actively browses the Drive tab.
        const discoveredFolders = items
          .filter((i) => i.type === "folder")
          .map((i) => ({ token: i.token, name: i.name, parentToken: rootToken }));
        if (discoveredFolders.length > 0) await addFoldersToCache("", discoveredFolders, activeAppKey);
        return items;
      } catch {
        return undefined;
      }
    })(),
  ]);

  const foldersByOrg: Record<string, FolderOption[]> = {};
  const orgRootTokens: Record<string, string | undefined> = {};
  for (const [org, root, tree] of folderTrees) {
    foldersByOrg[org] = tree;
    orgRootTokens[org] = root;
  }
  const flatFolderOptions = [
    { value: "", label: "— Chọn thư mục —" },
    ...orgKeys.flatMap((org) => {
      const rootToken = orgRootTokens[org];
      const orgLabel = org || "Dùng chung";
      const entries: { value: string; label: string }[] = [];
      if (rootToken) entries.push({ value: rootToken, label: `[${orgLabel}] — Thư mục gốc —` });
      for (const f of foldersByOrg[org] ?? []) {
        entries.push({ value: f.token, label: `[${orgLabel}] ${"　".repeat(f.depth - 1)}${f.name}` });
      }
      return entries;
    }),
  ];

  // Where a file currently lives — the latest move's target folder, falling
  // back to wherever it was created if it was never moved. Used to show a
  // real "origin folder" per file instead of just who created it.
  const latestFolderTokenByTarget = new Map<string, string>();
  for (const r of movedRows ?? []) {
    if (!r.target_id || latestFolderTokenByTarget.has(r.target_id)) continue;
    const token = (r.metadata as { targetFolder?: string } | null)?.targetFolder;
    if (token) latestFolderTokenByTarget.set(r.target_id, token);
  }
  const folderNameByToken = new Map<string, string>();
  for (const org of orgKeys) {
    const rootToken = orgRootTokens[org];
    if (rootToken) folderNameByToken.set(rootToken, org ? `${org} — thư mục gốc` : "Thư mục gốc");
    for (const f of foldersByOrg[org] ?? []) folderNameByToken.set(f.token, f.name);
  }
  const resolveFolderName = (targetId: string, createdFolderToken: string | null | undefined): string | null => {
    const token = latestFolderTokenByTarget.get(targetId) ?? createdFolderToken ?? null;
    return token ? (folderNameByToken.get(token) ?? null) : null;
  };

  const deletedIds = new Set<string | null>(trashRowsRaw.map((r) => r.documentId));
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

  // Personal trash + admin oversight, same split as most of these lists:
  // everyone can see and restore what THEY deleted, admins see the whole
  // app's trash (someone has to be able to recover a departed colleague's
  // accidental delete).
  const visibleTrashRows = isAdmin ? trashRowsRaw : trashRowsRaw.filter((r) => r.deletedBy === profile.id);
  const trashRows: TrashUiRow[] = visibleTrashRows.map((r) => ({
    documentId: r.documentId,
    fileType: r.fileType,
    title: r.title,
    originalFolderName: r.originalParentToken ? (folderNameByToken.get(r.originalParentToken) ?? "—") : "Thư mục gốc",
    deletedByName: r.deletedBy ? (profileById.get(r.deletedBy)?.fullName ?? "—") : "—",
    deletedAt: r.deletedAt,
    purgeAt: r.purgeAt,
    canManage: r.deletedBy === profile.id || isAdmin,
  }));

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
      folderName: resolveFolderName(r.target_id as string, r.metadata?.targetFolder),
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
            folderName: resolveFolderName(r.target_id as string, r.metadata?.targetFolder),
          };
        })
    : [];

  const dashboardData: DashboardData | null = isAdmin
    ? (() => {
        const createdRows = ((allCreatedRows ?? []) as AuditRow[]).filter(
          (r) => r.target_id && !deletedIds.has(r.target_id) && belongsToActiveApp(r),
        );
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

  const nowTs = Date.now();
  const ownLast7Days = historyRows.filter((r) => nowTs - new Date(r.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000).length;
  const adoptionPct =
    dashboardData && dashboardData.totalStaff > 0 ? Math.round((dashboardData.activeCreators / dashboardData.totalStaff) * 100) : 0;

  const namingPrefs = { ...DEFAULT_LARK_PREFS, ...profile.lark_prefs };
  const namingSegments = buildNamingSegments(namingPrefs, profile.department, todayYYYYMMDD());

  return {
    isAdmin,
    larkApps,
    activeAppKey,
    foldersByOrg,
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
  };
}
