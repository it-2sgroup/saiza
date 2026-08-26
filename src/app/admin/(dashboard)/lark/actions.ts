"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import { createLarkFile, deleteLarkFile, shareLarkDocByEmail, type LarkFileType } from "@/lib/lark/client";
import { parseShareRows, applyShareRows, type ShareResult } from "@/lib/lark/shareRows";
import { DEPARTMENT_CODES, ORG_CODES } from "@/lib/admin/departments";
import { buildFileName, MAX_FILENAME_LENGTH } from "@/lib/admin/fileNaming";
import { canDelete } from "@/lib/admin/permissions";

const VALID_FILE_TYPES: LarkFileType[] = ["docx", "sheet", "bitable", "folder"];

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
  const department = String(formData.get("department") ?? "").trim();
  const docTypeRaw = String(formData.get("docType") ?? "").trim();
  const docTypeOther = String(formData.get("docTypeOther") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const version = String(formData.get("version") ?? "").trim();
  const wip = formData.get("wip") === "on";

  if (org && !(ORG_CODES as readonly string[]).includes(org)) return { error: "Mã tổ chức không hợp lệ." };
  if (!department || !DEPARTMENT_CODES.includes(department)) return { error: "Chọn phòng ban." };
  const docType = docTypeRaw === "Khác" ? docTypeOther : docTypeRaw;
  if (!docType) return { error: "Chọn hoặc nhập loại tài liệu." };
  if (!content) return { error: "Nhập nội dung/dự án." };
  if (!/^\d{8}$/.test(date)) return { error: "Ngày không hợp lệ." };
  if (!version) return { error: "Chọn version." };

  const title = buildFileName({ org: org || null, department, docType, content, date, version, wip });
  if (title.length > MAX_FILENAME_LENGTH) {
    return { error: `Tên file dài ${title.length} ký tự, vượt giới hạn ${MAX_FILENAME_LENGTH}. Rút ngắn nội dung.` };
  }

  let documentId: string;
  let url: string;
  try {
    ({ documentId, url } = await createLarkFile(fileType, title, targetFolder));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không tạo được file Lark." };
  }

  let shared = false;
  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  const email = userData?.user?.email;
  if (email) {
    try {
      await shareLarkDocByEmail(documentId, email, "full_access", fileType);
      shared = true;
    } catch {
      // Best-effort — employee still gets the link, just may need manual access.
    }
  }

  const shareRows = parseShareRows(String(formData.get("shares") ?? "[]")).filter((r) => r.email !== email);
  const shareResults = await applyShareRows(documentId, shareRows, fileType);

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_created",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { title, url, shared, shares: shareResults, fileType },
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

  const shareResults = await applyShareRows(documentId, rows, fileType);

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

  try {
    await deleteLarkFile(documentId, fileType);
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
  revalidatePath("/admin/lark/lich-su");
  return { error: null, done: true };
}
