import "server-only";
import { listFolderChildren } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

export type FolderOption = { token: string; name: string; depth: number; parentToken: string };

const MAX_DEPTH = 4;
const MAX_FOLDERS = 150;
const CACHE_TTL_MS = 10 * 60 * 1000;

// BFS walk of the shared root folder so the create form can offer a
// destination picker. Bounded by depth/count so a runaway folder tree can't
// blow up request time.
async function crawlLarkFolderTree(rootToken: string): Promise<FolderOption[]> {
  const result: FolderOption[] = [];
  const queue: { token: string; depth: number }[] = [{ token: rootToken, depth: 0 }];

  while (queue.length > 0 && result.length < MAX_FOLDERS) {
    const { token, depth } = queue.shift()!;
    if (depth >= MAX_DEPTH) continue;

    let children: Awaited<ReturnType<typeof listFolderChildren>>;
    try {
      children = await listFolderChildren(token);
    } catch {
      continue;
    }

    for (const child of children) {
      if (result.length >= MAX_FOLDERS) break;
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
export async function listLarkFolderTree(rootToken: string, orgKey = ""): Promise<FolderOption[]> {
  const admin = createAdminClient();

  const { data: cached, error } = await admin
    .from("lark_folder_cache")
    .select("tree, updated_at")
    .eq("org", orgKey)
    .maybeSingle();

  if (!error && cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS) {
    return cached.tree as FolderOption[];
  }

  const tree = await crawlLarkFolderTree(rootToken);

  if (!error) {
    await admin.from("lark_folder_cache").upsert({ org: orgKey, tree, updated_at: new Date().toISOString() });
  }

  return tree;
}

// Write-through: call right after the app itself creates a folder so it
// shows up in the picker immediately instead of waiting up to CACHE_TTL_MS
// for the next crawl. Best-effort — a failure here just means the new
// folder appears a bit later, not that folder creation itself failed.
export async function addFolderToCache(orgKey: string, entry: { token: string; name: string; parentToken: string }) {
  try {
    const admin = createAdminClient();
    const { data: cached } = await admin.from("lark_folder_cache").select("tree").eq("org", orgKey).maybeSingle();
    const tree = ((cached?.tree as FolderOption[]) ?? []).filter((f) => f.token !== entry.token);
    const parent = tree.find((f) => f.token === entry.parentToken);
    const depth = parent ? parent.depth + 1 : 1;
    tree.push({ token: entry.token, name: entry.name, depth, parentToken: entry.parentToken });
    await admin.from("lark_folder_cache").upsert({ org: orgKey, tree, updated_at: new Date().toISOString() });
  } catch {
    // Non-fatal.
  }
}
