import "server-only";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "./fileTypes";

export type { LarkFileType } from "./fileTypes";
export { LARK_FILE_TYPE_LABELS } from "./fileTypes";

const LARK_API_BASE = "https://open.larksuite.com/open-apis";

export type LarkAppConfig = {
  key: string;
  label: string;
  appId: string;
  appSecret: string;
  docFolderToken?: string;
  orgFolderTokens?: Record<string, string>;
};

let cachedApps: LarkAppConfig[] | null = null;

// Every connected Lark app has its own Drive/My Space — files created by one
// app are invisible to another. LARK_APPS holds the full list (see
// .env.local); if unset, fall back to a single app built from the original
// standalone env vars so existing deployments don't need to change anything.
export function getLarkApps(): LarkAppConfig[] {
  if (cachedApps) return cachedApps;

  const raw = process.env.LARK_APPS?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as LarkAppConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedApps = parsed;
        return cachedApps;
      }
    } catch {
      // Malformed LARK_APPS — fall through to the single-app fallback below.
    }
  }

  let orgFolderTokens: Record<string, string> | undefined;
  try {
    orgFolderTokens = process.env.LARK_ORG_FOLDER_TOKENS ? JSON.parse(process.env.LARK_ORG_FOLDER_TOKENS) : undefined;
  } catch {
    orgFolderTokens = undefined;
  }

  cachedApps = [
    {
      key: "default",
      label: "Lark",
      appId: process.env.LARK_APP_ID ?? "",
      appSecret: process.env.LARK_APP_SECRET ?? "",
      docFolderToken: process.env.LARK_DOC_FOLDER_TOKEN,
      orgFolderTokens,
    },
  ];
  return cachedApps;
}

export function getDefaultAppKey(): string {
  return getLarkApps()[0]?.key ?? "default";
}

export function getLarkAppConfig(appKey?: string): LarkAppConfig {
  const apps = getLarkApps();
  return (appKey ? apps.find((a) => a.key === appKey) : undefined) ?? apps[0];
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

async function getTenantAccessToken(appKey?: string): Promise<string> {
  const app = getLarkAppConfig(appKey);
  const cached = tokenCache.get(app.key);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const res = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: app.appId, app_secret: app.appSecret }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không lấy được Lark access token (${app.label}): ${data.msg ?? res.statusText}`);
  }

  // Refresh a bit early to avoid using a token that expires mid-request.
  const token = data.tenant_access_token as string;
  tokenCache.set(app.key, { token, expiresAt: Date.now() + (data.expire - 60) * 1000 });
  return token;
}

async function larkFetch(path: string, body: Record<string, unknown>, appKey?: string) {
  const token = await getTenantAccessToken(appKey);
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

const mySpaceRootTokenCache = new Map<string, string>();

// Unlike docx/sheet/bitable creation (folder_token optional, defaults to the
// app's own "My Space" when omitted), Lark's create_folder endpoint rejects
// the request outright ("folder_token is required") if no parent is given —
// so when no target/env root is configured, resolve the app's own My Space
// root explicitly instead of failing.
async function getMySpaceRootFolderToken(appKey?: string): Promise<string> {
  const app = getLarkAppConfig(appKey);
  const cached = mySpaceRootTokenCache.get(app.key);
  if (cached) return cached;

  const token = await getTenantAccessToken(app.key);
  const res = await fetch(`${LARK_API_BASE}/drive/explorer/v2/root_folder/meta`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không lấy được thư mục gốc của app: ${data.msg ?? res.statusText}`);
  }
  const rootToken = data.data.token as string;
  mySpaceRootTokenCache.set(app.key, rootToken);
  return rootToken;
}

type LarkFile = { documentId: string; url: string; type: LarkFileType };

export async function createLarkFile(type: LarkFileType, title: string, targetFolderToken?: string, appKey?: string): Promise<LarkFile> {
  const app = getLarkAppConfig(appKey);
  const folderToken = targetFolderToken?.trim() || app.docFolderToken?.trim();
  const folderField = folderToken ? { folder_token: folderToken } : {};

  try {
    switch (type) {
      case "docx": {
        const data = await larkFetch("/docx/v1/documents", { title, ...folderField }, app.key);
        const documentId = data.document.document_id as string;
        return { documentId, url: `https://${process.env.LARK_WORKSPACE_DOMAIN}/docx/${documentId}`, type };
      }
      case "sheet": {
        const data = await larkFetch("/sheets/v3/spreadsheets", { title, ...folderField }, app.key);
        return { documentId: data.spreadsheet.spreadsheet_token, url: data.spreadsheet.url, type };
      }
      case "bitable": {
        const data = await larkFetch("/bitable/v1/apps", { name: title, ...folderField }, app.key);
        return { documentId: data.app.app_token, url: data.app.url, type };
      }
      case "folder": {
        const folderTokenForCreate = folderToken || (await getMySpaceRootFolderToken(app.key));
        const data = await larkFetch("/drive/v1/files/create_folder", { name: title, folder_token: folderTokenForCreate }, app.key);
        return { documentId: data.token, url: data.url, type };
      }
    }
  } catch (err) {
    const label = LARK_FILE_TYPE_LABELS[type];
    throw new Error(`Không tạo được ${label}: ${err instanceof Error ? err.message : "lỗi không rõ"}`);
  }
}

type LarkFolderEntry = { token: string; name: string };

export async function listFolderChildren(folderToken: string, appKey?: string): Promise<LarkFolderEntry[]> {
  const token = await getTenantAccessToken(appKey);
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

export type LarkDriveItem = { token: string; name: string; type: string; url?: string };

// Unlike listFolderChildren (folders only, used for the destination picker),
// this returns EVERY item in a folder — used by the Drive Explorer, which
// needs to show real files too, including ones that existed long before this
// website's own tracking (audit_log) did.
export async function listFolderContents(folderToken: string, appKey?: string): Promise<LarkDriveItem[]> {
  const token = await getTenantAccessToken(appKey);
  const res = await fetch(`${LARK_API_BASE}/drive/v1/files?folder_token=${folderToken}&page_size=200`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 0) {
    throw new Error(`Không đọc được thư mục: ${data.msg ?? res.statusText}`);
  }
  return (data.data.files as { token: string; name: string; type: string; url?: string }[]).map((f) => ({
    token: f.token,
    name: f.name,
    type: f.type,
    url: f.url,
  }));
}

export type LarkContact = { id: string; full_name: string; email: string; avatar_url: string | null };

// The people-picker (share/transfer-owner) needs the app's actual Lark org
// directory, not this website's own small list of staff with admin logins.
// contact:user.base:readonly is scoped to an admin-configured "visible
// range" (see Admin Console → App Management → Contacts Settings) — this
// simply returns whatever that range currently allows, which may be a
// subset of the real org if it hasn't been opened to "All members".
export async function listTenantContacts(appKey?: string): Promise<LarkContact[]> {
  const token = await getTenantAccessToken(appKey);

  const scopesRes = await fetch(`${LARK_API_BASE}/contact/v3/scopes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const scopesData = await scopesRes.json();
  if (!scopesRes.ok || scopesData.code !== 0) return [];
  const userIds = (scopesData.data?.user_ids as string[] | undefined) ?? [];
  if (userIds.length === 0) return [];

  const contacts: LarkContact[] = [];
  // Batch endpoint caps how many ids can be requested at once — chunk to stay safe.
  for (let i = 0; i < userIds.length; i += 50) {
    const chunk = userIds.slice(i, i + 50);
    const query = chunk.map((id) => `user_ids=${id}`).join("&");
    const res = await fetch(`${LARK_API_BASE}/contact/v3/users/batch?${query}&user_id_type=open_id`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || data.code !== 0) continue;
    type ContactUser = {
      open_id: string;
      name: string;
      enterprise_email?: string;
      email?: string;
      avatar?: { avatar_240?: string };
    };
    for (const u of (data.data?.items ?? []) as ContactUser[]) {
      const email = u.enterprise_email || u.email || "";
      if (!email) continue;
      contacts.push({ id: u.open_id, full_name: u.name, email, avatar_url: u.avatar?.avatar_240 ?? null });
    }
  }
  return contacts;
}

// Where the Drive Explorer starts browsing for a given app: its configured
// root if one was set, otherwise its true My Space root.
export async function getAppRootFolderToken(appKey?: string): Promise<string> {
  const app = getLarkAppConfig(appKey);
  return app.docFolderToken?.trim() || (await getMySpaceRootFolderToken(app.key));
}

// The app loses drive access to a file/folder once its ownership has been
// transferred to a person (see transferLarkFileOwner below) — Lark answers
// with this generic node-permission error, which is confusing on its own.
const OWNERSHIP_TRANSFERRED_HINT =
  "File này đã được chuyển quyền sở hữu cho một người dùng, app không còn quản lý được nữa — thao tác trực tiếp trong Lark.";

export async function moveLarkFile(documentId: string, targetFolderToken: string, type: LarkFileType, appKey?: string): Promise<void> {
  const token = await getTenantAccessToken(appKey);
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

export async function deleteLarkFile(documentId: string, type: LarkFileType, appKey?: string): Promise<void> {
  const token = await getTenantAccessToken(appKey);
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
export async function transferLarkFileOwner(
  documentId: string,
  email: string,
  type: LarkFileType = "docx",
  appKey?: string,
): Promise<void> {
  const token = await getTenantAccessToken(appKey);

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
  appKey?: string,
): Promise<void> {
  const token = await getTenantAccessToken(appKey);

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
