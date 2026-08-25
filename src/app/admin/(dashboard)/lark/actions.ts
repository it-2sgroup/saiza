"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import { createLarkDoc, shareLarkDocByEmail } from "@/lib/lark/client";

export type LarkDocFormState = { error: string | null; url?: string; title?: string };

export async function createLarkDocument(_prev: LarkDocFormState, formData: FormData): Promise<LarkDocFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Cần có tiêu đề." };

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

  await recordAuditLog({
    actorId: profile.id,
    action: "lark_doc_created",
    targetTable: "lark_docs",
    targetId: documentId,
    metadata: { title, url, shared },
  });

  revalidatePath("/admin/lark");
  return { error: null, url, title };
}
