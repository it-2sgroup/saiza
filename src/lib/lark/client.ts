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

export async function createLarkFile(type: LarkFileType, title: string): Promise<LarkFile> {
  const folderToken = process.env.LARK_DOC_FOLDER_TOKEN?.trim();
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

export async function deleteLarkFile(documentId: string, type: LarkFileType): Promise<void> {
  const token = await getTenantAccessToken();
  const res = await fetch(`${LARK_API_BASE}/drive/v1/files/${documentId}?type=${type}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không xoá được file: ${data.msg ?? res.statusText}`);
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
