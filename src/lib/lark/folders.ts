import "server-only";
import { listFolderChildren, getDefaultAppKey } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrashFolderTokenIfExists, TRASH_FOLDER_NAME } from "./trash";

export type FolderOption = { token: string; name: string; depth: number; parentToken: string };

const MAX_DEPTH = 4;
const MAX_FOLDERS = 150;
const CACHE_TTL_MS = 10 * 60 * 1000;

// BFS walk of the shared root folder so the create form can offer a
// destination picker. Bounded by depth/count so a runaway folder tree can't
// blow up request time.
async function crawlLarkFolderTree(rootToken: string, appKey?: string): Promise<FolderOption[]> {
  const result: FolderOption[] = [];
  const queue: { token: string; depth: number }[] = [{ token: rootToken, depth: 0 }];
  // Excluded so the trash folder never appears as a pickable move/create
  // destination, or as a browsable node in the folder-tree sidebar — it's
  // implementation detail, not a folder anyone should manually put things in.
  const trashFolderToken = await getTrashFolderTokenIfExists(appKey ?? getDefaultAppKey());

  while (queue.length > 0 && result.length < MAX_FOLDERS) {
    const { token, depth } = queue.shift()!;
    if (depth >= MAX_DEPTH) continue;

    let children: Awaited<ReturnType<typeof listFolderChildren>>;
    try {
      children = await listFolderChildren(token, appKey);
    } catch {
      continue;
    }

    for (const child of children) {
      if (result.length >= MAX_FOLDERS) break;
      // Matched by token (the normal case) AND by name (belt-and-suspenders:
      // a duplicate "ghost" trash folder with no tracked token — see the
      // comment on TRASH_FOLDER_NAME — would otherwise slip through here and
      // get crawled/cached like any other real folder).
      if (child.token === trashFolderToken || child.name === TRASH_FOLDER_NAME) continue;
      result.push({ token: child.token, name: child.name, depth: depth + 1, parentToken: token });
      queue.push({ token: child.token, depth: depth + 1 });
    }
  }

  return result;
}

// Cached read: avoids re-crawling the Lark Drive API (which the BFS above
// does, potentially dozens of requests) on every single /admin/lark page
// load. Falls back to a live crawl (uncached) if lark_folder_cache hasn't
// been migrated yet, same defensive pattern as the rest of the Lark tables.
// Cache key is (appKey, org) — different apps have entirely separate Drive
// spaces, so their folder trees must never be mixed together.
export async function listLarkFolderTree(rootToken: string, orgKey = "", appKey: string = getDefaultAppKey()): Promise<FolderOption[]> {
  const admin = createAdminClient();

  const { data: cached, error } = await admin
    .from("lark_folder_cache")
    .select("tree, updated_at")
    .eq("app_key", appKey)
    .eq("org", orgKey)
    .maybeSingle();

  if (!error && cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS) {
    // Re-filter even on a cache hit, not just inside the crawl below — a row
    // written before the trash folder existed (or before this exclusion
    // logic did) would otherwise keep serving it as a normal folder for up
    // to CACHE_TTL_MS after the fact, since a cache hit skips the crawl
    // entirely.
    const trashFolderToken = await getTrashFolderTokenIfExists(appKey);
    const tree = cached.tree as FolderOption[];
    return tree.filter((f) => f.token !== trashFolderToken && f.name !== TRASH_FOLDER_NAME);
  }

  const tree = await crawlLarkFolderTree(rootToken, appKey);

  if (!error) {
    await admin.from("lark_folder_cache").upsert({ app_key: appKey, org: orgKey, tree, updated_at: new Date().toISOString() });
  }

  return tree;
}

// Write-through: call right after the app itself creates a folder, or after
// live-browsing turns up folders the cache doesn't know about yet (see
// browseLarkFolder in actions.ts) — so they show up in the Move/Create-file
// pickers immediately instead of waiting up to CACHE_TTL_MS for the next
// crawl, or never (a plain BFS crawl can silently miss folders it can't
// reach, e.g. ones created outside this app). Best-effort — a failure here
// just means the folder appears a bit later, not that the calling action failed.
//
// Delegates the actual read-modify-write to a Postgres function
// (merge_lark_folder_cache, see supabase/migrations/0015_lark_caching.sql)
// instead of doing it here in application code — two concurrent calls for
// the same (appKey, orgKey) used to be able to both read the same stale
// tree and then overwrite each other, silently dropping whichever folder
// the losing write had discovered. The function takes a row lock
// (`FOR UPDATE`) so concurrent calls serialize instead of racing.
export async function addFoldersToCache(
  orgKey: string,
  entries: { token: string; name: string; parentToken: string }[],
  appKey: string = getDefaultAppKey(),
) {
  if (entries.length === 0) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("merge_lark_folder_cache", { p_app_key: appKey, p_org: orgKey, p_entries: entries });
    if (error) throw error;
  } catch {
    // Non-fatal — e.g. the migration hasn't been applied yet, or a transient
    // DB error. The folder just won't appear in the picker until the next
    // successful crawl.
  }
}

export async function addFolderToCache(
  orgKey: string,
  entry: { token: string; name: string; parentToken: string },
  appKey: string = getDefaultAppKey(),
) {
  return addFoldersToCache(orgKey, [entry], appKey);
}
