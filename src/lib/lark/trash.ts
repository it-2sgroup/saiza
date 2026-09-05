import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLarkFile, deleteLarkFile, moveLarkFile, getAppRootFolderToken, listFolderChildren, type LarkFileType } from "./client";
import { invalidateDriveCache } from "./driveCache";
import { recordAuditLog } from "@/lib/admin/audit";

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// A well-known, unmistakable name — this folder is only ever managed through
// this app's trash actions, never meant to be opened/renamed by hand in Lark.
// Exported so every place that lists/crawls folders (folders.ts, the Drive
// route, data.ts) can exclude it BY NAME as a second, independent check —
// relying solely on the tracked token in lark_trash_folder meant that if
// that row was ever missing (e.g. an insert failing right after the folder
// was created — exactly what happened before assertTrashSchemaReady existed),
// the folder would both (a) get excluded from nowhere, since nothing knew
// its token yet, and (b) get created AGAIN next time, since getOrCreateTrash-
// Folder had no way to know one already existed — producing duplicate,
// identically-named "ghost" trash folders. Matching by name breaks that.
export const TRASH_FOLDER_NAME = "🗑️ Thùng rác hệ thống — đừng xoá/đổi tên thư mục này";

const trashFolderTokenCache = new Map<string, string | null>();

// Guards every mutation below — checked BEFORE anything touches Lark. Without
// this, a not-yet-migrated environment (migration 0017 not applied) would
// still call moveLarkFile successfully, then fail on the lark_trash insert
// afterwards: the file ends up moved into a stray, untracked trash folder in
// Lark with no way for this app to find it again, while the user just sees a
// confusing error. Failing fast here means a missing migration produces a
// clear error and ZERO side effects, instead of a half-completed move.
async function assertTrashSchemaReady(): Promise<void> {
  const admin = createAdminClient();
  const [a, b] = await Promise.all([
    admin.from("lark_trash_folder").select("app_key").limit(0),
    admin.from("lark_trash").select("document_id").limit(0),
  ]);
  if (a.error || b.error) {
    // Logged with full detail for whoever's debugging; the caller (actions.ts)
    // wraps this in friendlyError and shows a generic message to the user —
    // "run migration 0017" means nothing to someone who isn't the developer.
    console.error("[assertTrashSchemaReady] lark_trash/lark_trash_folder unreachable", { a: a.error, b: b.error });
    throw new Error("lark_trash schema not ready");
  }
}

// Read-only lookup — never creates. Used to keep the trash folder out of
// every normal Drive listing/folder-tree/picker, which must work even before
// trash has ever been used once (i.e. before the folder exists at all).
export async function getTrashFolderTokenIfExists(appKey: string): Promise<string | null> {
  if (trashFolderTokenCache.has(appKey)) return trashFolderTokenCache.get(appKey)!;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("lark_trash_folder").select("folder_token").eq("app_key", appKey).maybeSingle();
    const token = data?.folder_token ?? null;
    trashFolderTokenCache.set(appKey, token);
    return token;
  } catch {
    return null;
  }
}

// Creates the trash folder on first use. Same insert-or-get race handling as
// getOrCreateDepartmentFolder in folderRegistry.ts: two people trashing a
// file for the first time at the same moment can both pass the initial
// SELECT, but onConflict+ignoreDuplicates plus a re-select after means only
// one folder ever wins and everyone converges on it.
async function getOrCreateTrashFolder(appKey: string): Promise<string> {
  const existing = await getTrashFolderTokenIfExists(appKey);
  if (existing) return existing;

  const admin = createAdminClient();
  const parentToken = await getAppRootFolderToken(appKey);

  // Before creating: a folder with this exact name may already sit in Lark
  // with no tracking row (the lark_trash_folder insert can fail independently
  // of the Lark-side create succeeding). Adopting it instead of blindly
  // creating another is what prevents duplicate "ghost" trash folders — the
  // exact bug this comment block used to not guard against.
  let documentId: string;
  const siblings = await listFolderChildren(parentToken, appKey).catch(() => []);
  const adopted = siblings.find((f) => f.name === TRASH_FOLDER_NAME);
  if (adopted) {
    documentId = adopted.token;
  } else {
    ({ documentId } = await createLarkFile("folder", TRASH_FOLDER_NAME, parentToken, appKey));
  }

  await admin
    .from("lark_trash_folder")
    .upsert({ app_key: appKey, folder_token: documentId }, { onConflict: "app_key", ignoreDuplicates: true });

  const { data: winner } = await admin.from("lark_trash_folder").select("folder_token").eq("app_key", appKey).maybeSingle();
  const winningToken = winner?.folder_token ?? documentId;
  trashFolderTokenCache.set(appKey, winningToken);
  return winningToken;
}

export type TrashRow = {
  documentId: string;
  appKey: string;
  fileType: LarkFileType;
  title: string;
  originalParentToken: string | null;
  deletedBy: string | null;
  deletedAt: string;
  purgeAt: string;
};

export async function listTrashRows(appKey: string): Promise<TrashRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("lark_trash")
    .select("document_id, app_key, file_type, title, original_parent_token, deleted_by, deleted_at, purge_at")
    .eq("app_key", appKey)
    .order("deleted_at", { ascending: false });

  return (data ?? []).map((r) => ({
    documentId: r.document_id,
    appKey: r.app_key,
    fileType: r.file_type as LarkFileType,
    title: r.title,
    originalParentToken: r.original_parent_token,
    deletedBy: r.deleted_by,
    deletedAt: r.deleted_at,
    purgeAt: r.purge_at,
  }));
}

/** Single-row lookup for restore/permanent-delete, where the caller only has a documentId. */
export async function getTrashRow(documentId: string): Promise<TrashRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("lark_trash")
    .select("document_id, app_key, file_type, title, original_parent_token, deleted_by, deleted_at, purge_at")
    .eq("document_id", documentId)
    .maybeSingle();
  if (!data) return null;
  return {
    documentId: data.document_id,
    appKey: data.app_key,
    fileType: data.file_type as LarkFileType,
    title: data.title,
    originalParentToken: data.original_parent_token,
    deletedBy: data.deleted_by,
    deletedAt: data.deleted_at,
    purgeAt: data.purge_at,
  };
}

/** Moves a file/folder into the app's trash folder and records it for restore/purge. */
export async function trashDocument(params: {
  documentId: string;
  fileType: LarkFileType;
  title: string;
  appKey: string;
  originalParentToken: string | null;
  deletedBy: string;
}): Promise<void> {
  const { documentId, fileType, title, appKey, originalParentToken, deletedBy } = params;
  await assertTrashSchemaReady();
  const trashFolder = await getOrCreateTrashFolder(appKey);

  await moveLarkFile(documentId, trashFolder, fileType, appKey);

  const admin = createAdminClient();
  const deletedAt = new Date();
  const { error } = await admin.from("lark_trash").upsert({
    document_id: documentId,
    app_key: appKey,
    file_type: fileType,
    title,
    original_parent_token: originalParentToken,
    deleted_by: deletedBy,
    deleted_at: deletedAt.toISOString(),
    purge_at: new Date(deletedAt.getTime() + RETENTION_MS).toISOString(),
  });
  if (error) throw new Error(`Đã chuyển vào Lark nhưng không ghi được vào thùng rác: ${error.message}`);

  await invalidateDriveCache(
    appKey,
    fileType === "folder" ? [originalParentToken, trashFolder, documentId] : [originalParentToken, trashFolder],
  );
}

export type RestoreResult = { restoredTo: "original" | "root" };

/** Moves a trashed item back out. Falls back to the app root if its original folder is gone. */
export async function restoreDocument(documentId: string, row: TrashRow): Promise<RestoreResult> {
  const trashFolder = await getOrCreateTrashFolder(row.appKey);
  let restoredTo: RestoreResult["restoredTo"] = "original";
  let destination = row.originalParentToken;

  if (destination) {
    try {
      await moveLarkFile(documentId, destination, row.fileType, row.appKey);
    } catch {
      // Original folder no longer reachable (e.g. it was trashed and purged
      // too) — same "restore orphans to root" fallback Google Drive uses.
      destination = null;
    }
  }

  if (!destination) {
    destination = await getAppRootFolderToken(row.appKey);
    restoredTo = "root";
    await moveLarkFile(documentId, destination, row.fileType, row.appKey);
  }

  const admin = createAdminClient();
  await admin.from("lark_trash").delete().eq("document_id", documentId);

  await invalidateDriveCache(row.appKey, row.fileType === "folder" ? [trashFolder, destination, documentId] : [trashFolder, destination]);

  return { restoredTo };
}

/** Real, irreversible-from-this-app deletion. Removes the trash row regardless of Lark's own result. */
export async function permanentlyDelete(documentId: string, fileType: LarkFileType, appKey: string): Promise<void> {
  const trashFolder = await getTrashFolderTokenIfExists(appKey);
  try {
    await deleteLarkFile(documentId, fileType, appKey);
  } finally {
    const admin = createAdminClient();
    await admin.from("lark_trash").delete().eq("document_id", documentId);
    if (trashFolder) await invalidateDriveCache(appKey, [trashFolder]);
  }
}

const purgeCheckedAt = new Map<string, number>();
const PURGE_CHECK_DEBOUNCE_MS = 6 * 60 * 60 * 1000;
const MAX_PURGE_PER_SWEEP = 20;

/**
 * Best-effort retention enforcement — there's no cron in this deployment, so
 * this runs opportunistically (see data.ts) whenever someone's page load
 * would benefit from it, debounced per app so it isn't a real DB scan on
 * every request. "30 days" is therefore an upper bound enforced on the next
 * time anyone loads the Lark page for that app, not a guaranteed exact-timer
 * purge — acceptable for a retention window, not for anything needing a
 * hard compliance deadline.
 */
export function purgeExpiredTrash(appKey: string) {
  const lastChecked = purgeCheckedAt.get(appKey) ?? 0;
  if (Date.now() - lastChecked < PURGE_CHECK_DEBOUNCE_MS) return;
  purgeCheckedAt.set(appKey, Date.now());

  const task = async () => {
    const admin = createAdminClient();
    const { data: expired } = await admin
      .from("lark_trash")
      .select("document_id, file_type")
      .eq("app_key", appKey)
      .lte("purge_at", new Date().toISOString())
      .limit(MAX_PURGE_PER_SWEEP);

    for (const row of expired ?? []) {
      try {
        await permanentlyDelete(row.document_id, row.file_type as LarkFileType, appKey);
        await recordAuditLog({
          action: "lark_doc_purged",
          targetTable: "lark_docs",
          targetId: row.document_id,
          metadata: { fileType: row.file_type, manual: false },
        });
      } catch {
        // Leave the row for the next sweep rather than losing track of it —
        // e.g. a transient Lark API error shouldn't silently drop the record.
      }
    }
  };

  try {
    after(task);
  } catch {
    void task().catch(() => {});
  }
}
