"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import { createLarkDoc, shareLarkDocByEmail } from "@/lib/lark/client";
import { parseShareRows, applyShareRows, type ShareResult } from "@/lib/lark/shareRows";
import { DEPARTMENT_CODES, ORG_CODES } from "@/lib/admin/departments";
import { buildFileName, MAX_FILENAME_LENGTH } from "@/lib/admin/fileNaming";

export type LarkDocFormState = {
  error: string | null;
  url?: string;
  title?: string;
  shareResults?: ShareResult[];
};

export async function createLarkDocument(_prev: LarkDocFormState, formData: FormData): Promise<LarkDocFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

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
    ({ documentId, url } = await createLarkDoc(title));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Không tạo được tài liệu Lark." };
  }

  let shared = false;
  const admin = createAdminClient();
  const { data: userData } = await admin.auth.admin.getUserById(profile.id);
  const email = userData?.user?.email;
  if (email) {
    try {
      await shareLarkDocByEmail(documentId, email, "full_access");
      shared = true;
    } catch {
      // Best-effort — employee still gets the link, just may need manual access.
    }
  }

  const shareRows = parseShareRows(String(formData.get("shares") ?? "[]")).filter((r) => r.email !== email);
  const shareResults = await applyShareRows(documentId, shareRows);

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_created",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { title, url, shared, shares: shareResults },
  });

  revalidatePath("/admin/lark");
  return { error: null, url, title, shareResults };
}

export type ShareExistingState = { error: string | null; shareResults?: ShareResult[] };

export async function shareExistingDocument(
  documentId: string,
  _prev: ShareExistingState,
  formData: FormData,
): Promise<ShareExistingState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const rows = parseShareRows(String(formData.get("shares") ?? "[]"));
  if (rows.length === 0) return { error: "Chọn ít nhất một người để chia sẻ." };

  const shareResults = await applyShareRows(documentId, rows);

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
