"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile, type Profile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import {
  createLarkFile,
  moveLarkFile,
  shareLarkDocByEmail,
  transferLarkFileOwner,
  getDefaultAppKey,
  getLarkApps,
  type LarkFileType,
} from "@/lib/lark/client";
import { parseShareRows, applyShareRows, type ShareResult } from "@/lib/lark/shareRows";
import { resolveRootFolderToken } from "@/lib/lark/orgFolders";
import { getOrCreateDepartmentFolder } from "@/lib/lark/folderRegistry";
import { addFolderToCache } from "@/lib/lark/folders";
import { addItemToDriveCache, invalidateDriveCache } from "@/lib/lark/driveCache";
import { trashDocument, restoreDocument, permanentlyDelete, getTrashRow } from "@/lib/lark/trash";
import { friendlyError } from "@/lib/errors";

import { buildFileName, buildFolderName, sanitizeNameSegment, MAX_FILENAME_LENGTH } from "@/lib/admin/fileNaming";
import { canManageAnyLarkDoc } from "@/lib/admin/permissions";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { getConfigLists } from "@/lib/admin/configLists";
import type { LarkPrefs } from "@/lib/lark/prefs";

const VALID_FILE_TYPES: LarkFileType[] = ["docx", "sheet", "bitable", "folder"];

// A file/folder always belongs to whichever app created it, regardless of
// which app the current user has active for NEW creations — using the
// wrong one fails outright since apps have separate Drive spaces. Rows
// created before this feature existed never recorded an appKey, so they
// default to the original (first-configured) app.
async function resolveDocAppKey(admin: ReturnType<typeof createAdminClient>, documentId: string): Promise<string> {
  const { data } = await admin
    .from("audit_log")
    .select("metadata")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();
  const appKey = (data?.metadata as { appKey?: string } | null)?.appKey;
  return appKey ?? getDefaultAppKey();
}

// Which folder a doc currently sits in, reconstructed from the audit trail:
// the newest `lark_doc_moved` wins, falling back to where it was created.
// Needed so a move/delete can drop the *source* folder's cached listing —
// otherwise that folder keeps serving a listing containing a file that isn't
// in it anymore, which no amount of TTL tuning makes correct.
async function resolveDocFolder(admin: ReturnType<typeof createAdminClient>, documentId: string): Promise<string | null> {
  const { data } = await admin
    .from("audit_log")
    .select("metadata")
    .in("action", ["lark_doc_created", "lark_doc_moved"])
    .eq("target_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.metadata as { targetFolder?: string | null } | null)?.targetFolder ?? null;
}

// Best-effort — used only to snapshot a human-readable name into lark_trash,
// never for anything security-relevant. Missing/renamed-in-Lark just means
// the trash list shows a slightly stale or generic title.
async function resolveDocTitle(admin: ReturnType<typeof createAdminClient>, documentId: string): Promise<string> {
  const { data } = await admin
    .from("audit_log")
    .select("metadata")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();
  return (data?.metadata as { title?: string } | null)?.title ?? "(không có tiêu đề)";
}

// Move/delete/transfer-ownership all gate on the same rule: the person who
// created the file, or an admin. Deliberately NOT canDelete/"editor" — most
// of the org Drive was never created through this app (see the Drive tab's
// own doc comment), so "editor" here would mean "can move/delete/transfer
// ownership of any file in the company, including ones they've never seen
// before that belong to someone else." Returns an error message to return
// from the caller's action, or null when allowed.
async function checkDocPermission(
  admin: ReturnType<typeof createAdminClient>,
  profile: Profile,
  documentId: string,
  deniedMessage: string,
): Promise<string | null> {
  const { data: creationRow } = await admin
    .from("audit_log")
    .select("actor_id")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();

  const isOwner = creationRow?.actor_id === profile.id;
  if (!isOwner && !(await canManageAnyLarkDoc(profile.role))) return deniedMessage;
  return null;
}

export type LarkDocFormState = {
  error: string | null;
  url?: string;
  title?: string;
  shareResults?: ShareResult[];
};

export async function createLarkDocument(_prev: LarkDocFormState, formData: FormData): Promise<LarkDocFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const fileType = String(formData.get("fileType") ?? "docx").trim() as LarkFileType;
  if (!VALID_FILE_TYPES.includes(fileType)) return { error: "Loại file không hợp lệ." };
  const targetFolder = String(formData.get("targetFolder") ?? "").trim() || undefined;

  const org = String(formData.get("org") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: fileType === "folder" ? "Nhập tên thư mục." : "Nhập nội dung/dự án." };
  // buildFileName/buildFolderName strip characters unsafe for a Lark title
  // (see UNSAFE_CHARS in fileNaming.ts) — content that's non-empty here but
  // made up ONLY of those characters (e.g. "///") would otherwise collapse
  // to "" inside the title and silently vanish instead of erroring.
  if (!sanitizeNameSegment(content)) {
    return { error: 'Nội dung chỉ chứa ký tự không hợp lệ (\\ / : * ? " < > |). Nhập lại.' };
  }
  const { departments, orgCodes } = await getConfigLists();
  if (org && !orgCodes.some((o) => o.code === org)) return { error: "Mã tổ chức không hợp lệ." };

  const includeDept = formData.get("includeDept") === "on";
  let department: string | null = null;
  if (includeDept) {
    department = String(formData.get("department") ?? "").trim();
    if (!department || !departments.some((d) => d.code === department)) return { error: "Chọn phòng ban." };
  }

  let title: string;
  if (fileType === "folder") {
    title = buildFolderName({ org: org || null, department, name: content });
  } else {
    const includeDocType = formData.get("includeDocType") === "on";
    const includeDate = formData.get("includeDate") === "on";
    const includeVersion = formData.get("includeVersion") === "on";
    const wip = formData.get("wip") === "on";

    let docType: string | null = null;
    if (includeDocType) {
      const docTypeRaw = String(formData.get("docType") ?? "").trim();
      // Unlike docTypeRaw's preset options (DOC_TYPES, already safe), a
      // custom "Khác" value is free text and needs the same sanitizing as
      // `content` — otherwise a stray "/" here lands unescaped in the title.
      const docTypeOther = sanitizeNameSegment(String(formData.get("docTypeOther") ?? ""));
      docType = docTypeRaw === "Khác" ? docTypeOther : docTypeRaw;
      if (!docType) return { error: "Chọn hoặc nhập loại tài liệu." };
    }

    let date: string | null = null;
    if (includeDate) {
      date = String(formData.get("date") ?? "").trim();
      if (!/^\d{8}$/.test(date)) return { error: "Ngày không hợp lệ." };
    }

    let version: string | null = null;
    if (includeVersion) {
      version = String(formData.get("version") ?? "").trim();
      if (!version) return { error: "Chọn version." };
    }

    title = buildFileName({ org: org || null, department, docType, content, date, version, wip });
  }
  if (!title) return { error: "Nội dung/tên không hợp lệ để đặt tên file." };

  if (title.length > MAX_FILENAME_LENGTH) {
    return { error: `Tên file dài ${title.length} ký tự, vượt giới hạn ${MAX_FILENAME_LENGTH}. Rút ngắn nội dung.` };
  }

  const appKey = profile.lark_prefs.activeApp || getDefaultAppKey();

  // No explicit folder picked → route into the canonical (org, department)
  // folder, auto-provisioned on first use (see folderRegistry.ts), instead of
  // always dropping into the bare org root.
  const effectiveFolder =
    targetFolder ||
    (department ? await getOrCreateDepartmentFolder(org, department, appKey) : undefined) ||
    resolveRootFolderToken(org || null, appKey);

  let documentId: string;
  let url: string;
  try {
    ({ documentId, url } = await createLarkFile(fileType, title, effectiveFolder, appKey));
  } catch (err) {
    return { error: friendlyError("createLarkDocument", err, "Không tạo được file. Vui lòng thử lại sau ít phút.") };
  }

  // Write-through: a manually-created subfolder should appear in the picker
  // right away instead of waiting for the next cache crawl.
  if (fileType === "folder" && effectiveFolder) {
    await addFolderToCache(org || "", { token: documentId, name: title, parentToken: effectiveFolder }, appKey);
  }
  // Same idea for the Drive tab's cached listing — otherwise a just-created
  // file/folder only shows up there once the (short) drive-cache TTL expires.
  if (effectiveFolder) {
    await addItemToDriveCache(effectiveFolder, appKey, { token: documentId, name: title, type: fileType, url });
  }

  // Transferring ownership makes the creator the real Lark owner instead of a
  // full_access collaborator, which is what lets them delete/rename it straight
  // from the Lark UI without hitting "Yêu cầu xoá — liên hệ 2SGROUP" (delete
  // rights on a shared-space item are gated by the parent folder's settings for
  // anyone but the owner). The tradeoff: once the app isn't the owner anymore,
  // it also loses the ability to move/delete that item through this website's
  // own buttons — so this is opt-in per file, not the default.
  const wantsOwnershipTransfer = formData.get("transferOwnership") === "on";

  let shared = false;
  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  const email = userData?.user?.email;
  if (email) {
    try {
      if (wantsOwnershipTransfer) {
        await transferLarkFileOwner(documentId, email, fileType, appKey);
      } else {
        await shareLarkDocByEmail(documentId, email, "full_access", fileType, appKey);
      }
      shared = true;
    } catch {
      // Best-effort — employee still gets the link, just may need manual access.
    }
  }

  const shareRows = parseShareRows(String(formData.get("shares") ?? "[]")).filter((r) => r.email !== email);
  const shareResults = await applyShareRows(documentId, shareRows, fileType, appKey);

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_created",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: {
      title,
      url,
      shared,
      shares: shareResults,
      fileType,
      org: org || null,
      ownerTransferred: wantsOwnershipTransfer && shared,
      appKey,
      // Which Lark folder this landed in — lets the file lists show where a
      // file actually lives, not just who created it. moveLarkDocument
      // already records its own targetFolder on move; readers should prefer
      // the latest lark_doc_moved entry over this one when both exist.
      targetFolder: effectiveFolder ?? null,
    },
  });

  revalidatePath("/admin/lark");
  return { error: null, url, title, shareResults };
}

export type ShareExistingState = { error: string | null; shareResults?: ShareResult[] };

export async function shareExistingDocument(
  documentId: string,
  fileType: LarkFileType,
  _prev: ShareExistingState,
  formData: FormData,
): Promise<ShareExistingState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const rows = parseShareRows(String(formData.get("shares") ?? "[]"));
  if (rows.length === 0) return { error: "Chọn ít nhất một người để chia sẻ." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(admin, profile, documentId, "Bạn không có quyền chia sẻ file này.");
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);
  const shareResults = await applyShareRows(documentId, rows, fileType, appKey);

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_shared",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { shares: shareResults },
  });

  revalidatePath("/admin/lark");
  return { error: null, shareResults };
}

export type LarkPrefsState = { error: string | null; success?: boolean };

export async function updateLarkPrefs(_prev: LarkPrefsState, formData: FormData): Promise<LarkPrefsState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const org = String(formData.get("defaultOrg") ?? "").trim();
  const version = String(formData.get("defaultVersion") ?? "").trim();
  const department = String(formData.get("defaultDepartment") ?? "").trim();
  const docType = String(formData.get("defaultDocType") ?? "").trim();
  const { departments, orgCodes, docTypes } = await getConfigLists();
  if (org && !orgCodes.some((o) => o.code === org)) return { error: "Mã tổ chức không hợp lệ." };
  if (version && !(VERSION_OPTIONS as readonly string[]).includes(version)) return { error: "Version không hợp lệ." };
  if (department && !departments.some((d) => d.code === department)) return { error: "Phòng ban không hợp lệ." };
  if (docType && !docTypes.some((d) => d.code === docType)) return { error: "Loại tài liệu không hợp lệ." };

  const prefs: LarkPrefs = {
    includeDept: formData.get("includeDept") === "on",
    includeDocType: formData.get("includeDocType") === "on",
    includeDate: formData.get("includeDate") === "on",
    includeVersion: formData.get("includeVersion") === "on",
    ...(org ? { defaultOrg: org } : {}),
    ...(version ? { defaultVersion: version } : {}),
    ...(department ? { defaultDepartment: department } : {}),
    ...(docType ? { defaultDocType: docType } : {}),
    // Preserve the app switcher's selection — this form doesn't edit it.
    ...(profile.lark_prefs.activeApp ? { activeApp: profile.lark_prefs.activeApp } : {}),
  };

  // Service-role client, but hard-coded to only ever touch `lark_prefs` —
  // same reasoning as updateFullName in ho-so/actions.ts.
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ lark_prefs: prefs }).eq("id", profile.id);
  if (error) return { error: friendlyError("updateLarkPrefs", error, "Không lưu được cài đặt. Vui lòng thử lại.") };

  revalidatePath("/admin/lark");
  return { error: null, success: true };
}

// Lightweight, separate from updateLarkPrefs so switching apps in the header
// doesn't need to resubmit the whole naming-prefs form.
export async function switchLarkApp(appKey: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  // An unvalidated value here would persist into lark_prefs.activeApp and
  // later flow into audit_log.metadata.appKey on the next file the user
  // creates — getLarkAppConfig silently falls back to the default app on an
  // unknown key, so nothing breaks today, but there's no reason to let a
  // garbage value in in the first place.
  if (!getLarkApps().some((a) => a.key === appKey)) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ lark_prefs: { ...profile.lark_prefs, activeApp: appKey } })
    .eq("id", profile.id);

  revalidatePath("/admin/lark");
}

export type MoveLarkDocState = { error: string | null; done?: boolean };

export async function moveLarkDocument(
  documentId: string,
  fileType: LarkFileType,
  _prev: MoveLarkDocState,
  formData: FormData,
): Promise<MoveLarkDocState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const targetFolder = String(formData.get("targetFolder") ?? "").trim();
  if (!targetFolder) return { error: "Chọn thư mục đích." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(admin, profile, documentId, "Bạn không có quyền di chuyển file này.");
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);
  const sourceFolder = await resolveDocFolder(admin, documentId);

  try {
    await moveLarkFile(documentId, targetFolder, fileType, appKey);
  } catch (err) {
    return { error: friendlyError("moveLarkDocument", err, "Không di chuyển được file. Vui lòng thử lại sau ít phút.") };
  }

  // Both ends of the move are now wrong in cache: the file left one folder
  // and joined another.
  await invalidateDriveCache(appKey, [sourceFolder, targetFolder]);

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_moved",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { targetFolder },
  });

  revalidatePath("/admin/lark");
  return { error: null, done: true };
}

export type DeleteLarkDocState = { error: string | null; done?: boolean };

// "Xoá" moves the item into this app's own Trash instead of deleting it
// outright — see src/lib/lark/trash.ts for why (Lark's own recycle bin has
// no restore/list API we can drive). Recoverable for 30 days via the Trash
// tab; permanentlyDeleteLarkDocument below is the actual point of no return.
export async function deleteLarkDocument(
  documentId: string,
  fileType: LarkFileType,
  _prev: DeleteLarkDocState,
): Promise<DeleteLarkDocState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(admin, profile, documentId, "Bạn không có quyền xoá file này.");
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);
  const sourceFolder = await resolveDocFolder(admin, documentId);
  const title = await resolveDocTitle(admin, documentId);

  try {
    await trashDocument({ documentId, fileType, title, appKey, originalParentToken: sourceFolder, deletedBy: profile.id });
  } catch (err) {
    return { error: friendlyError("deleteLarkDocument", err, "Không xoá được file. Vui lòng thử lại sau ít phút.") };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_trashed",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType, targetFolder: sourceFolder },
  });

  revalidatePath("/admin/lark");
  return { error: null, done: true };
}

export type RestoreTrashState = { error: string | null; done?: boolean; restoredTo?: "original" | "root" };

export async function restoreLarkDocument(documentId: string, _prev: RestoreTrashState): Promise<RestoreTrashState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const row = await getTrashRow(documentId);
  if (!row) return { error: "File này không còn trong thùng rác." };

  const isDeleter = row.deletedBy === profile.id;
  if (!isDeleter && !(await canManageAnyLarkDoc(profile.role))) return { error: "Bạn không có quyền khôi phục file này." };

  let restoredTo: "original" | "root";
  try {
    ({ restoredTo } = await restoreDocument(documentId, row));
  } catch (err) {
    return { error: friendlyError("restoreLarkDocument", err, "Không khôi phục được file. Vui lòng thử lại sau ít phút.") };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_restored",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType: row.fileType, restoredTo },
  });

  revalidatePath("/admin/lark");
  return { error: null, done: true, restoredTo };
}

export type PermanentDeleteState = { error: string | null; done?: boolean };

// The actual point of no return — real Lark delete, called directly from the
// Trash tab (either the user clears their own item early, or an admin does,
// or the 30-day sweep in purgeExpiredTrash calls permanentlyDelete directly
// without going through this action).
export async function permanentlyDeleteLarkDocument(documentId: string, _prev: PermanentDeleteState): Promise<PermanentDeleteState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const row = await getTrashRow(documentId);
  if (!row) return { error: "File này không còn trong thùng rác." };

  const isDeleter = row.deletedBy === profile.id;
  if (!isDeleter && !(await canManageAnyLarkDoc(profile.role))) return { error: "Bạn không có quyền xoá vĩnh viễn file này." };

  try {
    await permanentlyDelete(documentId, row.fileType, row.appKey);
  } catch (err) {
    return { error: friendlyError("permanentlyDeleteLarkDocument", err, "Không xoá vĩnh viễn được file. Vui lòng thử lại sau ít phút.") };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_purged",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType: row.fileType, manual: true },
  });

  revalidatePath("/admin/lark");
  return { error: null, done: true };
}

export type TransferOwnerState = { error: string | null; done?: boolean };

export async function transferLarkDocumentOwner(
  documentId: string,
  fileType: LarkFileType,
  _prev: TransferOwnerState,
  formData: FormData,
): Promise<TransferOwnerState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Nhập email người nhận." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(admin, profile, documentId, "Bạn không có quyền chuyển quyền sở hữu file này.");
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);

  try {
    await transferLarkFileOwner(documentId, email, fileType, appKey);
  } catch (err) {
    return { error: friendlyError("transferLarkDocumentOwner", err, "Không chuyển được quyền sở hữu. Vui lòng thử lại sau ít phút.") };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_owner_transferred",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { email },
  });

  revalidatePath("/admin/lark");
  return { error: null, done: true };
}
