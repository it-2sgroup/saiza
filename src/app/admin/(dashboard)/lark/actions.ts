"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import {
  createLarkFile,
  deleteLarkFile,
  moveLarkFile,
  shareLarkDocByEmail,
  transferLarkFileOwner,
  getDefaultAppKey,
  getAppRootFolderToken,
  listFolderContents,
  type LarkDriveItem,
  type LarkFileType,
} from "@/lib/lark/client";
import { parseShareRows, applyShareRows, type ShareResult } from "@/lib/lark/shareRows";
import { resolveRootFolderToken } from "@/lib/lark/orgFolders";
import { getOrCreateDepartmentFolder } from "@/lib/lark/folderRegistry";
import { addFolderToCache } from "@/lib/lark/folders";
import { DEPARTMENT_CODES, ORG_CODES } from "@/lib/admin/departments";
import { buildFileName, buildFolderName, MAX_FILENAME_LENGTH } from "@/lib/admin/fileNaming";
import { canDelete } from "@/lib/admin/permissions";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
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
  if (org && !(ORG_CODES as readonly string[]).includes(org)) return { error: "Mã tổ chức không hợp lệ." };

  const includeDept = formData.get("includeDept") === "on";
  let department: string | null = null;
  if (includeDept) {
    department = String(formData.get("department") ?? "").trim();
    if (!department || !DEPARTMENT_CODES.includes(department)) return { error: "Chọn phòng ban." };
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
      const docTypeOther = String(formData.get("docTypeOther") ?? "").trim();
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
    return { error: err instanceof Error ? err.message : "Không tạo được file Lark." };
  }

  // Write-through: a manually-created subfolder should appear in the picker
  // right away instead of waiting for the next cache crawl.
  if (fileType === "folder" && effectiveFolder) {
    await addFolderToCache(org || "", { token: documentId, name: title, parentToken: effectiveFolder }, appKey);
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
  if (org && !(ORG_CODES as readonly string[]).includes(org)) return { error: "Mã tổ chức không hợp lệ." };
  if (version && !(VERSION_OPTIONS as readonly string[]).includes(version)) return { error: "Version không hợp lệ." };

  const prefs: LarkPrefs = {
    includeDept: formData.get("includeDept") === "on",
    includeDocType: formData.get("includeDocType") === "on",
    includeDate: formData.get("includeDate") === "on",
    includeVersion: formData.get("includeVersion") === "on",
    ...(org ? { defaultOrg: org } : {}),
    ...(version ? { defaultVersion: version } : {}),
    // Preserve the app switcher's selection — this form doesn't edit it.
    ...(profile.lark_prefs.activeApp ? { activeApp: profile.lark_prefs.activeApp } : {}),
  };

  // Service-role client, but hard-coded to only ever touch `lark_prefs` —
  // same reasoning as updateFullName in ho-so/actions.ts.
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ lark_prefs: prefs }).eq("id", profile.id);
  if (error) return { error: `Không lưu được: ${error.message}` };

  revalidatePath("/admin/lark");
  return { error: null, success: true };
}

// Lightweight, separate from updateLarkPrefs so switching apps in the header
// doesn't need to resubmit the whole naming-prefs form.
export async function switchLarkApp(appKey: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;

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
  const { data: creationRow } = await admin
    .from("audit_log")
    .select("actor_id")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();

  const isOwner = creationRow?.actor_id === profile.id;
  if (!isOwner && !canDelete(profile.role)) {
    return { error: "Bạn không có quyền di chuyển file này." };
  }

  const appKey = await resolveDocAppKey(admin, documentId);

  try {
    await moveLarkFile(documentId, targetFolder, fileType, appKey);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không di chuyển được file." };
  }

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

export async function deleteLarkDocument(
  documentId: string,
  fileType: LarkFileType,
  _prev: DeleteLarkDocState,
): Promise<DeleteLarkDocState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const admin = createAdminClient();
  const { data: creationRow } = await admin
    .from("audit_log")
    .select("actor_id")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();

  const isOwner = creationRow?.actor_id === profile.id;
  if (!isOwner && !canDelete(profile.role)) {
    return { error: "Bạn không có quyền xoá file này." };
  }

  const appKey = await resolveDocAppKey(admin, documentId);

  try {
    await deleteLarkFile(documentId, fileType, appKey);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không xoá được file." };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_deleted",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType },
  });

  revalidatePath("/admin/lark");
  return { error: null, done: true };
}

export type DriveBrowseState = { error: string | null; folderToken?: string; items?: LarkDriveItem[] };

// Reads the LIVE folder contents of the given app, regardless of whether
// anything in it was ever created through this website — unlike the
// audit_log-based lists above, this is what surfaces pre-existing content.
export async function browseLarkFolder(folderToken: string | null, appKey: string): Promise<DriveBrowseState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  try {
    const resolvedToken = folderToken || (await getAppRootFolderToken(appKey));
    const items = await listFolderContents(resolvedToken, appKey);
    return { error: null, folderToken: resolvedToken, items };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không đọc được thư mục." };
  }
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
  const { data: creationRow } = await admin
    .from("audit_log")
    .select("actor_id")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();

  const isOwner = creationRow?.actor_id === profile.id;
  if (!isOwner && !canDelete(profile.role)) {
    return { error: "Bạn không có quyền chuyển quyền sở hữu file này." };
  }

  const appKey = await resolveDocAppKey(admin, documentId);

  try {
    await transferLarkFileOwner(documentId, email, fileType, appKey);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không chuyển được quyền sở hữu." };
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
