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
  getStorageAppKey,
  getAppRootFolderToken,
  getLarkApps,
  type LarkFileType,
} from "@/lib/lark/client";
import {
  parseShareRows,
  applyShareRows,
  type ShareResult,
} from "@/lib/lark/shareRows";
import { resolveRootFolderToken } from "@/lib/lark/orgFolders";
import { getOrCreateDepartmentFolder } from "@/lib/lark/folderRegistry";
import {
  getOrCreatePersonalFolder,
  getPersonalFolderToken,
} from "@/lib/lark/personalFolders";
import {
  addFolderToCache,
  listLarkFolderTree,
  isWithinSubtree,
} from "@/lib/lark/folders";
import { isTenantMember } from "@/lib/lark/contactsCache";
import {
  addItemToDriveCache,
  invalidateDriveCache,
} from "@/lib/lark/driveCache";
import {
  trashDocument,
  restoreDocument,
  permanentlyDelete,
  getTrashRow,
} from "@/lib/lark/trash";
import { notifyLarkChanged } from "@/lib/lark/broadcast";
import { friendlyError } from "@/lib/errors";

import {
  buildFileName,
  buildFolderName,
  sanitizeNameSegment,
  MAX_FILENAME_LENGTH,
} from "@/lib/admin/fileNaming";
import { canAccessLark, canManageAnyLarkDoc } from "@/lib/admin/permissions";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { getConfigLists } from "@/lib/admin/configLists";
import type { LarkPrefs, LarkNamingTemplate } from "@/lib/lark/prefs";

const VALID_FILE_TYPES: LarkFileType[] = ["docx", "sheet", "bitable", "folder"];

// A file/folder always belongs to whichever app created it, regardless of
// which app the current user has active for NEW creations — using the
// wrong one fails outright since apps have separate Drive spaces. Rows
// created before this feature existed never recorded an appKey, so they
// default to the original (first-configured) app.
async function resolveDocAppKey(
  admin: ReturnType<typeof createAdminClient>,
  documentId: string,
): Promise<string> {
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
async function resolveDocFolder(
  admin: ReturnType<typeof createAdminClient>,
  documentId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("audit_log")
    .select("metadata")
    .in("action", ["lark_doc_created", "lark_doc_moved"])
    .eq("target_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (
    (data?.metadata as { targetFolder?: string | null } | null)?.targetFolder ??
    null
  );
}

// Best-effort — used only to snapshot a human-readable name into lark_trash,
// never for anything security-relevant. Missing/renamed-in-Lark just means
// the trash list shows a slightly stale or generic title.
async function resolveDocTitle(
  admin: ReturnType<typeof createAdminClient>,
  documentId: string,
): Promise<string> {
  const { data } = await admin
    .from("audit_log")
    .select("metadata")
    .eq("action", "lark_doc_created")
    .eq("target_id", documentId)
    .maybeSingle();
  return (
    (data?.metadata as { title?: string } | null)?.title ?? "(không có tiêu đề)"
  );
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
  if (!isOwner && !(await canManageAnyLarkDoc(profile.role)))
    return deniedMessage;
  return null;
}

// True when candidateToken is personalFolderToken itself, or lives inside
// its subtree — the check both createLarkDocument and moveLarkDocument run
// against a submitted targetFolder for a "Nhân viên"-role caller before
// trusting it. Re-crawls the storage tenant's tree (cached, same as the
// picker's own data) rather than trusting anything client-supplied, since a
// confined role's UI never offers a folder outside their own subtree in the
// first place — reaching this with an out-of-bounds token means the value
// was tampered with, not a real navigation choice.
async function isWithinPersonalFolder(
  candidateToken: string,
  personalFolderToken: string,
  appKey: string,
): Promise<boolean> {
  if (candidateToken === personalFolderToken) return true;
  try {
    const root = await getAppRootFolderToken(appKey);
    const tree = await listLarkFolderTree(root, "", appKey);
    return isWithinSubtree(tree, candidateToken, personalFolderToken);
  } catch {
    return false;
  }
}

export type LarkDocFormState = {
  error: string | null;
  url?: string;
  title?: string;
  shareResults?: ShareResult[];
};

export async function createLarkDocument(
  _prev: LarkDocFormState,
  formData: FormData,
): Promise<LarkDocFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const fileType = String(
    formData.get("fileType") ?? "docx",
  ).trim() as LarkFileType;
  if (!VALID_FILE_TYPES.includes(fileType))
    return { error: "Loại file không hợp lệ." };
  const targetFolder =
    String(formData.get("targetFolder") ?? "").trim() || undefined;

  const org = String(formData.get("org") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!content)
    return {
      error:
        fileType === "folder" ? "Nhập tên thư mục." : "Nhập nội dung/dự án.",
    };
  // buildFileName/buildFolderName strip characters unsafe for a Lark title
  // (see UNSAFE_CHARS in fileNaming.ts) — content that's non-empty here but
  // made up ONLY of those characters (e.g. "///") would otherwise collapse
  // to "" inside the title and silently vanish instead of erroring.
  if (!sanitizeNameSegment(content)) {
    return {
      error:
        'Nội dung chỉ chứa ký tự không hợp lệ (\\ / : * ? " < > |). Nhập lại.',
    };
  }
  const { departments, orgCodes } = await getConfigLists();
  if (org && !orgCodes.some((o) => o.code === org))
    return { error: "Mã tổ chức không hợp lệ." };

  // "Đặt tên tự do" — the popup-local toggle in LarkDocForm. When on, the
  // whole naming-convention block (org/phòng ban/loại tài liệu/version/
  // ngày/WIP) is skipped entirely and `content` becomes the literal title,
  // sanitized but not prefixed/suffixed. Deliberately not persisted
  // anywhere (unlike lark_prefs) — it's a one-off choice per file, not a
  // standing default.
  const namingMode =
    String(formData.get("namingMode") ?? "structured").trim() === "custom"
      ? "custom"
      : "structured";

  let department: string | null = null;
  let title: string;
  if (namingMode === "custom") {
    title = sanitizeNameSegment(content);
  } else {
    const includeDept = formData.get("includeDept") === "on";
    if (includeDept) {
      department = String(formData.get("department") ?? "").trim();
      if (!department || !departments.some((d) => d.code === department))
        return { error: "Chọn phòng ban." };
    }

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
        const docTypeOther = sanitizeNameSegment(
          String(formData.get("docTypeOther") ?? ""),
        );
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

      title = buildFileName({
        org: org || null,
        department,
        docType,
        content,
        date,
        version,
        wip,
      });
    }
  }
  if (!title) return { error: "Nội dung/tên không hợp lệ để đặt tên file." };

  if (title.length > MAX_FILENAME_LENGTH) {
    return {
      error: `Tên file dài ${title.length} ký tự, vượt giới hạn ${MAX_FILENAME_LENGTH}. Rút ngắn nội dung.`,
    };
  }

  // Always the central Pro-tier tenant — see getStorageAppKey's doc comment.
  // NOT profile.lark_prefs.activeApp: that reflects which org's Drive the
  // creator happens to be browsing, which has nothing to do with where a
  // brand-new file should actually be stored.
  const appKey = getStorageAppKey();

  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  const email = userData?.user?.email;

  // A "Nhân viên"-role caller (no canManageLarkOrgWide) is confined to their
  // own personal folder and its subfolders — never the department/org-root
  // targeting below. The Create-file dialog's own picker already only
  // offers folders inside that subtree (see data.ts's createFoldersByOrg),
  // so a mismatched targetFolder here means the value was tampered with,
  // not a real choice — silently falling back to their own root rather than
  // erroring keeps this from ever blocking the primary action.
  const isOrgWideManager = await canManageAnyLarkDoc(profile.role);
  let effectiveFolder: string | undefined;
  if (isOrgWideManager) {
    // No explicit folder picked → route into the canonical (org, department)
    // folder, auto-provisioned on first use (see folderRegistry.ts), instead
    // of always dropping into the bare org root.
    effectiveFolder =
      targetFolder ||
      (department
        ? await getOrCreateDepartmentFolder(org, department, appKey)
        : undefined) ||
      resolveRootFolderToken(org || null, appKey);
  } else {
    const personalFolder = await getOrCreatePersonalFolder(
      profile.id,
      profile.full_name,
      profile.department,
      email ?? null,
      appKey,
    );
    effectiveFolder =
      targetFolder &&
      personalFolder &&
      (await isWithinPersonalFolder(targetFolder, personalFolder, appKey))
        ? targetFolder
        : personalFolder;
  }

  let documentId: string;
  let url: string;
  try {
    ({ documentId, url } = await createLarkFile(
      fileType,
      title,
      effectiveFolder,
      appKey,
    ));
  } catch (err) {
    return {
      error: friendlyError(
        "createLarkDocument",
        err,
        "Không tạo được file. Vui lòng thử lại sau ít phút.",
      ),
    };
  }

  // Write-through: a manually-created subfolder should appear in the picker
  // right away instead of waiting for the next cache crawl.
  if (fileType === "folder" && effectiveFolder) {
    await addFolderToCache(
      org || "",
      { token: documentId, name: title, parentToken: effectiveFolder },
      appKey,
    );
  }
  // Same idea for the Drive tab's cached listing — otherwise a just-created
  // file/folder only shows up there once the (short) drive-cache TTL expires.
  if (effectiveFolder) {
    await addItemToDriveCache(effectiveFolder, appKey, {
      token: documentId,
      name: title,
      type: fileType,
      url,
    });
  }

  let shared = false;
  let ownerTransferred = false;
  if (email) {
    // Always grant full_access first — the guaranteed baseline, which works
    // even when the creator isn't an actual member of the storage tenant
    // (2sgroup): shareLarkDocByEmail's resolver checks every connected
    // app's own directory, not just 2sgroup's, so someone who only has a
    // SISMO/SAIZA/etc. Lark account still gets real, named access — not a
    // public "anyone with the link" grant. Doing this unconditionally, not
    // only when the person isn't a 2sgroup member, fixes a real lockout:
    // files now always land in 2sgroup regardless of which org's Lark the
    // creator belongs to, so ownership transfer below routinely doesn't
    // apply to anyone outside 2sgroup — before this, that left the creator
    // with zero access to a file they just made.
    try {
      await shareLarkDocByEmail(
        documentId,
        email,
        "full_access",
        fileType,
        appKey,
      );
      shared = true;
    } catch {
      // Best-effort — this only fails if the email isn't resolvable in ANY
      // connected org's Lark directory at all. Employee still gets the
      // link, just may need manual access.
    }

    // Automatic, not a per-file choice (there used to be a "Chuyển quyền sở
    // hữu cho tôi" toggle here) — and gated on real tenant membership rather
    // than always attempting it. Ownership transfer makes the creator the
    // real Lark owner (lets them delete/rename it straight from the Lark UI
    // without hitting "Yêu cầu xoá — liên hệ 2SGROUP"), but it also
    // physically relocates the document into the new owner's own Drive.
    // Doing that for someone outside 2sgroup would move the file's storage
    // out of the paid, centralized tenant into whichever other (often
    // storage-capped) org they belong to — see isTenantMember's own doc
    // comment. transferLarkFileOwner's own tenant-scoped resolution is a
    // second, independent guard against that; this check just avoids even
    // attempting (and logging) a transfer that can never succeed/apply for
    // most creators, and lets a genuine 2sgroup member's files stay theirs
    // without them ever having to think about a checkbox.
    if (await isTenantMember(email, appKey)) {
      try {
        await transferLarkFileOwner(documentId, email, fileType, appKey);
        ownerTransferred = true;
      } catch {
        // Best-effort — falls back to the full_access share already granted.
      }
    }
  }

  const shareRows = parseShareRows(
    String(formData.get("shares") ?? "[]"),
  ).filter((r) => r.email !== email);
  const shareResults = await applyShareRows(
    documentId,
    shareRows,
    fileType,
    appKey,
  );

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
      ownerTransferred,
      appKey,
      // Which Lark folder this landed in — lets the file lists show where a
      // file actually lives, not just who created it. moveLarkDocument
      // already records its own targetFolder on move; readers should prefer
      // the latest lark_doc_moved entry over this one when both exist.
      targetFolder: effectiveFolder ?? null,
    },
  });

  revalidatePath("/admin/lark");
  await notifyLarkChanged(appKey);
  return { error: null, url, title, shareResults };
}

export type ShareExistingState = {
  error: string | null;
  shareResults?: ShareResult[];
};

export async function shareExistingDocument(
  documentId: string,
  fileType: LarkFileType,
  _prev: ShareExistingState,
  formData: FormData,
): Promise<ShareExistingState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const rows = parseShareRows(String(formData.get("shares") ?? "[]"));
  if (rows.length === 0) return { error: "Chọn ít nhất một người để chia sẻ." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(
    admin,
    profile,
    documentId,
    "Bạn không có quyền chia sẻ file này.",
  );
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

export async function updateLarkPrefs(
  _prev: LarkPrefsState,
  formData: FormData,
): Promise<LarkPrefsState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const org = String(formData.get("defaultOrg") ?? "").trim();
  const version = String(formData.get("defaultVersion") ?? "").trim();
  const department = String(formData.get("defaultDepartment") ?? "").trim();
  const docType = String(formData.get("defaultDocType") ?? "").trim();
  const { departments, orgCodes, docTypes } = await getConfigLists();
  if (org && !orgCodes.some((o) => o.code === org))
    return { error: "Mã tổ chức không hợp lệ." };
  if (version && !(VERSION_OPTIONS as readonly string[]).includes(version))
    return { error: "Version không hợp lệ." };
  if (department && !departments.some((d) => d.code === department))
    return { error: "Phòng ban không hợp lệ." };
  if (docType && !docTypes.some((d) => d.code === docType))
    return { error: "Loại tài liệu không hợp lệ." };

  const prefs: LarkPrefs = {
    includeDept: formData.get("includeDept") === "on",
    includeDocType: formData.get("includeDocType") === "on",
    includeDate: formData.get("includeDate") === "on",
    includeVersion: formData.get("includeVersion") === "on",
    ...(org ? { defaultOrg: org } : {}),
    ...(version ? { defaultVersion: version } : {}),
    ...(department ? { defaultDepartment: department } : {}),
    ...(docType ? { defaultDocType: docType } : {}),
    // Preserve fields this form doesn't edit — the app switcher's selection
    // and any saved naming templates. This rebuilds lark_prefs from scratch,
    // so leaving either out would silently wipe it on the next save here.
    ...(profile.lark_prefs.activeApp
      ? { activeApp: profile.lark_prefs.activeApp }
      : {}),
    ...(profile.lark_prefs.templates
      ? { templates: profile.lark_prefs.templates }
      : {}),
  };

  // Service-role client, but hard-coded to only ever touch `lark_prefs` —
  // same reasoning as updateFullName in ho-so/actions.ts.
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ lark_prefs: prefs })
    .eq("id", profile.id);
  if (error)
    return {
      error: friendlyError(
        "updateLarkPrefs",
        error,
        "Không lưu được cài đặt. Vui lòng thử lại.",
      ),
    };

  revalidatePath("/admin/lark");
  return { error: null, success: true };
}

// Not a useActionState/FormData action like the others — this is invoked
// directly from LarkDocForm's local component state (org/department/
// includeDept/etc.), which was never part of a submitted <form> (the create
// form uses those same values for the file being created, not this). Server
// Actions can be called as plain async functions like this; no native form
// needed.
export async function saveLarkNamingTemplate(input: {
  name: string;
  includeDept: boolean;
  includeDocType: boolean;
  includeDate: boolean;
  includeVersion: boolean;
  org: string;
  department: string;
  docType: string;
  version: string;
  wip: boolean;
}): Promise<{ error: string | null; template?: LarkNamingTemplate }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const name = input.name.trim();
  if (!name) return { error: "Nhập tên cho mẫu này." };

  const { departments, orgCodes, docTypes } = await getConfigLists();
  if (input.org && !orgCodes.some((o) => o.code === input.org))
    return { error: "Mã tổ chức không hợp lệ." };
  if (input.department && !departments.some((d) => d.code === input.department))
    return { error: "Phòng ban không hợp lệ." };
  if (
    input.docType &&
    input.docType !== "Khác" &&
    !docTypes.some((d) => d.code === input.docType)
  )
    return { error: "Loại tài liệu không hợp lệ." };

  const template: LarkNamingTemplate = {
    id: crypto.randomUUID(),
    name,
    includeDept: input.includeDept,
    includeDocType: input.includeDocType,
    includeDate: input.includeDate,
    includeVersion: input.includeVersion,
    org: input.org,
    department: input.department,
    docType: input.docType,
    version: input.version,
    wip: input.wip,
  };

  // Caps the list so repeatedly saving doesn't grow this unboundedly inside
  // the shared lark_prefs JSONB blob — same reasoning as MAX_PERSISTED_FOLDERS
  // in useDriveFolders.ts.
  const MAX_TEMPLATES = 20;
  const templates = [...(profile.lark_prefs.templates ?? []), template].slice(
    -MAX_TEMPLATES,
  );

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ lark_prefs: { ...profile.lark_prefs, templates } })
    .eq("id", profile.id);
  if (error)
    return {
      error: friendlyError(
        "saveLarkNamingTemplate",
        error,
        "Không lưu được mẫu. Vui lòng thử lại.",
      ),
    };

  revalidatePath("/admin/lark");
  return { error: null, template };
}

export async function deleteLarkNamingTemplate(
  templateId: string,
): Promise<{ error: string | null }> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const templates = (profile.lark_prefs.templates ?? []).filter(
    (t) => t.id !== templateId,
  );
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ lark_prefs: { ...profile.lark_prefs, templates } })
    .eq("id", profile.id);
  if (error)
    return {
      error: friendlyError(
        "deleteLarkNamingTemplate",
        error,
        "Không xoá được mẫu. Vui lòng thử lại.",
      ),
    };

  revalidatePath("/admin/lark");
  return { error: null };
}

// Lightweight, separate from updateLarkPrefs so switching apps in the header
// doesn't need to resubmit the whole naming-prefs form.
export async function switchLarkApp(appKey: string): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) return;
  if (!(await canAccessLark(profile.role))) return;
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
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const targetFolder = String(formData.get("targetFolder") ?? "").trim();
  if (!targetFolder) return { error: "Chọn thư mục đích." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(
    admin,
    profile,
    documentId,
    "Bạn không có quyền di chuyển file này.",
  );
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);
  const sourceFolder = await resolveDocFolder(admin, documentId);

  // A "Nhân viên"-role caller can only ever reach here as the file's owner
  // (checkDocPermission above), never via canManageAnyLarkDoc — but that
  // still lets them move their own file to anywhere the client is willing
  // to submit, unless this is enforced server-side too. The Move dialog's
  // own picker never offers anything outside their personal subtree (see
  // data.ts's flatFolderOptions), so failing loudly here only ever fires on
  // a tampered request, not a real navigation choice.
  if (!(await canManageAnyLarkDoc(profile.role))) {
    const personalFolder = await getPersonalFolderToken(profile.id, appKey);
    if (
      !personalFolder ||
      !(await isWithinPersonalFolder(targetFolder, personalFolder, appKey))
    ) {
      return {
        error: "Bạn chỉ có thể di chuyển file trong thư mục cá nhân của mình.",
      };
    }
  }

  try {
    await moveLarkFile(documentId, targetFolder, fileType, appKey);
  } catch (err) {
    return {
      error: friendlyError(
        "moveLarkDocument",
        err,
        "Không di chuyển được file. Vui lòng thử lại sau ít phút.",
      ),
    };
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
  await notifyLarkChanged(appKey);
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
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(
    admin,
    profile,
    documentId,
    "Bạn không có quyền xoá file này.",
  );
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);
  const sourceFolder = await resolveDocFolder(admin, documentId);
  const title = await resolveDocTitle(admin, documentId);

  try {
    await trashDocument({
      documentId,
      fileType,
      title,
      appKey,
      originalParentToken: sourceFolder,
      deletedBy: profile.id,
    });
  } catch (err) {
    return {
      error: friendlyError(
        "deleteLarkDocument",
        err,
        "Không xoá được file. Vui lòng thử lại sau ít phút.",
      ),
    };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_trashed",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType, targetFolder: sourceFolder },
  });

  revalidatePath("/admin/lark");
  await notifyLarkChanged(appKey);
  return { error: null, done: true };
}

export type RestoreTrashState = {
  error: string | null;
  done?: boolean;
  restoredTo?: "original" | "root";
};

export async function restoreLarkDocument(
  documentId: string,
  _prev: RestoreTrashState,
): Promise<RestoreTrashState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const row = await getTrashRow(documentId);
  if (!row) return { error: "File này không còn trong thùng rác." };

  const isDeleter = row.deletedBy === profile.id;
  if (!isDeleter && !(await canManageAnyLarkDoc(profile.role)))
    return { error: "Bạn không có quyền khôi phục file này." };

  let restoredTo: "original" | "root";
  try {
    ({ restoredTo } = await restoreDocument(documentId, row));
  } catch (err) {
    return {
      error: friendlyError(
        "restoreLarkDocument",
        err,
        "Không khôi phục được file. Vui lòng thử lại sau ít phút.",
      ),
    };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_restored",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType: row.fileType, restoredTo },
  });

  revalidatePath("/admin/lark");
  await notifyLarkChanged(row.appKey);
  return { error: null, done: true, restoredTo };
}

export type PermanentDeleteState = { error: string | null; done?: boolean };

// The actual point of no return — real Lark delete, called directly from the
// Trash tab (either the user clears their own item early, or an admin does,
// or the 30-day sweep in purgeExpiredTrash calls permanentlyDelete directly
// without going through this action).
export async function permanentlyDeleteLarkDocument(
  documentId: string,
  _prev: PermanentDeleteState,
): Promise<PermanentDeleteState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const row = await getTrashRow(documentId);
  if (!row) return { error: "File này không còn trong thùng rác." };

  const isDeleter = row.deletedBy === profile.id;
  if (!isDeleter && !(await canManageAnyLarkDoc(profile.role)))
    return { error: "Bạn không có quyền xoá vĩnh viễn file này." };

  try {
    await permanentlyDelete(documentId, row.fileType, row.appKey);
  } catch (err) {
    return {
      error: friendlyError(
        "permanentlyDeleteLarkDocument",
        err,
        "Không xoá vĩnh viễn được file. Vui lòng thử lại sau ít phút.",
      ),
    };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_purged",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { fileType: row.fileType, manual: true },
  });

  revalidatePath("/admin/lark");
  await notifyLarkChanged(row.appKey);
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
  if (!(await canAccessLark(profile.role)))
    return { error: "Bạn không có quyền dùng chức năng này." };

  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Nhập email người nhận." };

  const admin = createAdminClient();
  const permissionError = await checkDocPermission(
    admin,
    profile,
    documentId,
    "Bạn không có quyền chuyển quyền sở hữu file này.",
  );
  if (permissionError) return { error: permissionError };

  const appKey = await resolveDocAppKey(admin, documentId);

  try {
    await transferLarkFileOwner(documentId, email, fileType, appKey);
  } catch (err) {
    return {
      error: friendlyError(
        "transferLarkDocumentOwner",
        err,
        "Không chuyển được quyền sở hữu. Vui lòng thử lại sau ít phút.",
      ),
    };
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
