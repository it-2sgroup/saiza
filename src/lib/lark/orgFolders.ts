import "server-only";

let cachedMap: Record<string, string> | null = null;

function orgFolderMap(): Record<string, string> {
  if (cachedMap) return cachedMap;
  const raw = process.env.LARK_ORG_FOLDER_TOKENS?.trim();
  try {
    cachedMap = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    cachedMap = {};
  }
  return cachedMap;
}

// Root folder for a given org code, falling back to the shared default
// (LARK_DOC_FOLDER_TOKEN) when the org has no dedicated root configured, or
// none was selected ("Không riêng").
export function resolveRootFolderToken(org: string | null | undefined): string | undefined {
  const fallback = process.env.LARK_DOC_FOLDER_TOKEN?.trim() || undefined;
  if (!org) return fallback;
  return orgFolderMap()[org] ?? fallback;
}

export function listConfiguredOrgs(): string[] {
  return Object.keys(orgFolderMap());
}
