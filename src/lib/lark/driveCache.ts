import "server-only";
import { listFolderContents, type LarkDriveItem } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

// Unlike lark_folder_cache (folder hierarchy only, used by the Move/Create
// picker), this caches a folder's actual LISTING — files and folders both —
// so opening the Drive tab, navigating into a folder, or just reloading the
// page doesn't re-hit Lark's Drive API every single time. A short TTL keeps
// it reasonably fresh since files/folders are actively being created here.
const CACHE_TTL_MS = 3 * 60 * 1000;

export async function listFolderContentsCached(folderToken: string, appKey: string): Promise<LarkDriveItem[]> {
  const admin = createAdminClient();

  const { data: cached, error } = await admin
    .from("lark_drive_cache")
    .select("items, updated_at")
    .eq("app_key", appKey)
    .eq("folder_token", folderToken)
    .maybeSingle();

  if (!error && cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS) {
    return cached.items as LarkDriveItem[];
  }

  const items = await listFolderContents(folderToken, appKey);

  if (!error) {
    await admin
      .from("lark_drive_cache")
      .upsert({ app_key: appKey, folder_token: folderToken, items, updated_at: new Date().toISOString() });
  }

  return items;
}

// Write-through: call right after the app itself creates a file/folder so it
// shows up in the Drive tab immediately instead of waiting up to
// CACHE_TTL_MS — same reasoning as addFoldersToCache in folders.ts, but for
// full listings rather than just the folder tree. A lost update here (two
// people creating into the same folder at the same instant) just means the
// slower write's item appears once the TTL naturally expires, which is an
// acceptable tradeoff given how short the TTL already is.
export async function addItemToDriveCache(folderToken: string, appKey: string, item: LarkDriveItem) {
  try {
    const admin = createAdminClient();
    const { data: cached, error } = await admin
      .from("lark_drive_cache")
      .select("items")
      .eq("app_key", appKey)
      .eq("folder_token", folderToken)
      .maybeSingle();
    if (error || !cached) return; // No cached entry for this folder yet — nothing to keep warm.

    const items = ((cached.items as LarkDriveItem[]) ?? []).filter((i) => i.token !== item.token);
    items.push(item);
    await admin
      .from("lark_drive_cache")
      .upsert({ app_key: appKey, folder_token: folderToken, items, updated_at: new Date().toISOString() });
  } catch {
    // Non-fatal.
  }
}
