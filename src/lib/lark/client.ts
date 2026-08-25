import "server-only";

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

export async function createLarkDoc(title: string): Promise<{ documentId: string; url: string }> {
  const token = await getTenantAccessToken();
  const folderToken = process.env.LARK_DOC_FOLDER_TOKEN?.trim();

  const res = await fetch(`${LARK_API_BASE}/docx/v1/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, ...(folderToken ? { folder_token: folderToken } : {}) }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không tạo được tài liệu Lark: ${data.msg ?? res.statusText}`);
  }

  const documentId = data.data.document.document_id as string;
  return { documentId, url: `https://${process.env.LARK_WORKSPACE_DOMAIN}/docx/${documentId}` };
}

// Best-effort: sharing can fail if the email isn't a real member of the Lark
// tenant. Callers must not fail doc creation when this throws.
export async function shareLarkDocByEmail(
  documentId: string,
  email: string,
  perm: "view" | "edit" | "full_access",
): Promise<void> {
  const token = await getTenantAccessToken();

  const res = await fetch(`${LARK_API_BASE}/drive/v1/permissions/${documentId}/members?type=docx`, {
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
