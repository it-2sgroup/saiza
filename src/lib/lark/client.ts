import "server-only";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "./fileTypes";

export type { LarkFileType } from "./fileTypes";
export { LARK_FILE_TYPE_LABELS } from "./fileTypes";

const LARK_API_BASE = "https://open.larksuite.com/open-apis";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

async function getTenantAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.token;

  const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.LARK_APP_ID,
      app_secret: process.env.LARK_APP_SECRET,
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không lấy được Lark access token: ${data.msg ?? res.statusText}`);
  }

  // Refresh a bit early to avoid using a token that expires mid-request.
  tokenCache = { token: data.tenant_access_token, expiresAt: Date.now() + (data.expire - 60) * 1000 };
  return tokenCache.token;
}

async function larkFetch(path: string, body: Record<string, unknown>) {
  const token = await getTenantAccessToken();
  const res = await fetch(`${LARK_API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(data.msg ?? res.statusText);
  }
  return data.data;
}

export type LarkFile = { documentId: string; url: string; type: LarkFileType };

export async function createLarkFile(type: LarkFileType, title: string, targetFolderToken?: string): Promise<LarkFile> {
  const folderToken = targetFolderToken?.trim() || process.env.LARK_DOC_FOLDER_TOKEN?.trim();
  const folderField = folderToken ? { folder_token: folderToken } : {};

  try {
    switch (type) {
      case "docx": {
        const data = await larkFetch("/docx/v1/documents", { title, ...folderField });
        const documentId = data.document.document_id as string;
        return { documentId, url: `https://${process.env.LARK_WORKSPACE_DOMAIN}/docx/${documentId}`, type };
      }
      case "sheet": {
        const data = await larkFetch("/sheets/v3/spreadsheets", { title, ...folderField });
        return { documentId: data.spreadsheet.spreadsheet_token, url: data.spreadsheet.url, type };
      }
      case "bitable": {
        const data = await larkFetch("/bitable/v1/apps", { name: title, ...folderField });
        return { documentId: data.app.app_token, url: data.app.url, type };
      }
      case "folder": {
        const data = await larkFetch("/drive/v1/files/create_folder", { name: title, ...folderField });
        return { documentId: data.token, url: data.url, type };
      }
    }
  } catch (err) {
    const label = LARK_FILE_TYPE_LABELS[type];
    throw new Error(`Không tạo được ${label}: ${err instanceof Error ? err.message : "lỗi không rõ"}`);
  }
}

export type LarkFolderEntry = { token: string; name: string };

export async function listFolderChildren(folderToken: string): Promise<LarkFolderEntry[]> {
  const token = await getTenantAccessToken();
  const res = await fetch(`${LARK_API_BASE}/drive/v1/files?folder_token=${folderToken}&page_size=200`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không đọc được thư mục: ${data.msg ?? res.statusText}`);
  }
  return (data.data.files as { token: string; name: string; type: string }[])
    .filter((f) => f.type === "folder")
    .map((f) => ({ token: f.token, name: f.name }));
}

// The app loses drive access to a file/folder once its ownership has been
// transferred to a person (see transferLarkFileOwner below) — Lark answers
// with this generic node-permission error, which is confusing on its own.
const OWNERSHIP_TRANSFERRED_HINT =
  "File này đã được chuyển quyền sở hữu cho một người dùng, app không còn quản lý được nữa — thao tác trực tiếp trong Lark.";

export async function moveLarkFile(documentId: string, targetFolderToken: string, type: LarkFileType): Promise<void> {
  const token = await getTenantAccessToken();
  const res = await fetch(`${LARK_API_BASE}/drive/v1/files/${documentId}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ type, folder_token: targetFolderToken }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    if (data.code === 1062501) throw new Error(OWNERSHIP_TRANSFERRED_HINT);
    throw new Error(`Không di chuyển được file: ${data.msg ?? res.statusText}`);
  }
}

export async function deleteLarkFile(documentId: string, type: LarkFileType): Promise<void> {
  const token = await getTenantAccessToken();
  const res = await fetch(`${LARK_API_BASE}/drive/v1/files/${documentId}?type=${type}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    if (data.code === 1062501) throw new Error(OWNERSHIP_TRANSFERRED_HINT);
    throw new Error(`Không xoá được file: ${data.msg ?? res.statusText}`);
  }
}

// Makes `email` the actual Lark owner of the file/folder, not just a
// full_access collaborator. Matters for folders especially: delete/manage
// permission on a shared-space item is gated by the PARENT folder's settings
// for anyone who isn't the owner, so a plain full_access grant still shows
// "Yêu cầu xoá — liên hệ 2SGROUP" when the person tries to delete it from
// the Lark UI directly. Best-effort — callers must not fail file creation
// when this throws (e.g. email isn't a real tenant member, or transfer
// isn't supported for this file type).
export async function transferLarkFileOwner(documentId: string, email: string, type: LarkFileType = "docx"): Promise<void> {
  const token = await getTenantAccessToken();

  const res = await fetch(
    `${LARK_API_BASE}/drive/v1/permissions/${documentId}/members/transfer_owner?type=${type}&need_notification=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ member_type: "email", member_id: email }),
      cache: "no-store",
    },
  );
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không chuyển được quyền sở hữu cho ${email}: ${data.msg ?? res.statusText}`);
  }
}

// Best-effort: sharing can fail if the email isn't a real member of the Lark
// tenant. Callers must not fail file creation when this throws.
export async function shareLarkDocByEmail(
  documentId: string,
  email: string,
  perm: "view" | "edit" | "full_access",
  type: LarkFileType = "docx",
): Promise<void> {
  const token = await getTenantAccessToken();

  const res = await fetch(`${LARK_API_BASE}/drive/v1/permissions/${documentId}/members?type=${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ member_type: "email", member_id: email, perm }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không chia sẻ được cho ${email}: ${data.msg ?? res.statusText}`);
  }
}
