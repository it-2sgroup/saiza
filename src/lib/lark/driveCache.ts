import "server-only";
import { after } from "next/server";
import { listFolderContents, type LarkDriveItem } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

// Unlike lark_folder_cache (folder hierarchy only, used by the Move/Create
// picker), this caches a folder's actual LISTING — files and folders both —
// so opening the Drive tab, navigating into a folder, or just reloading the
// page doesn't re-hit Lark's Drive API every single time.
//
// Freshness is deliberately split in two, which is what makes navigation feel
// instant (the "stale-while-revalidate" pattern every large Drive-style app
// uses):
//   * younger than FRESH_MS  → serve from Postgres, no upstream call at all
//   * older than FRESH_MS    → STILL serve from Postgres immediately, and
//                              refresh from Lark in the background
//   * no cached row at all   → the only case that blocks on the Lark API
// Previously anything past the TTL blocked on a live Lark round-trip, so a
// folder you hadn't touched in a few minutes felt exactly as slow as a folder
// you'd never opened.
const FRESH_MS = 60 * 1000;

// How long a background refresh is considered "already handled" — stops a
// burst of navigations/prefetches for the same stale folder from each firing
// their own duplicate Lark call.
const REVALIDATE_DEBOUNCE_MS = 15 * 1000;
const revalidatedAt = new Map<string, number>();

// Fire-and-forget work must be handed to `after()` on serverless, or the
// runtime can freeze the instance the moment the response is sent and the
// refresh silently never happens. Falls back to a floating promise when
// there's no request context (e.g. called from a script).
function background(task: () => Promise<void>) {
  try {
    after(task);
  } catch {
    void task().catch(() => {});
  }
}

function cacheKey(appKey: string, folderToken: string) {
  return `${appKey}:${folderToken}`;
}

async function fetchAndStore(folderToken: string, appKey: string): Promise<LarkDriveItem[]> {
  const items = await listFolderContents(folderToken, appKey);
  const admin = createAdminClient();
  await admin.from("lark_drive_cache").upsert({ app_key: appKey, folder_token: folderToken, items, updated_at: new Date().toISOString() });
  return items;
}

/**
 * Reads a folder listing through the Postgres cache.
 *
 * @param warmChildren When true, every subfolder in the returned listing that
 *   isn't already cached gets fetched in the background. This is what turns a
 *   click into a subfolder from "wait for Lark" into "read a warm row" — by
 *   the time the user clicks, the row is usually already there. Only the
 *   user-facing entry point sets this; the background warm pass itself passes
 *   false so warming can't recurse down the whole tree.
 */
export async function listFolderContentsCached(
  folderToken: string,
  appKey: string,
  { warmChildren = false }: { warmChildren?: boolean } = {},
): Promise<LarkDriveItem[]> {
  const admin = createAdminClient();

  const { data: cached, error } = await admin
    .from("lark_drive_cache")
    .select("items, updated_at")
    .eq("app_key", appKey)
    .eq("folder_token", folderToken)
    .maybeSingle();

  // `error` here means the cache table itself is unreachable (e.g. migration
  // not applied yet) — fall through to always-live behaviour rather than
  // failing the request.
  if (!error && cached) {
    const items = (cached.items as LarkDriveItem[]) ?? [];
    const age = Date.now() - new Date(cached.updated_at).getTime();

    if (age >= FRESH_MS) {
      const key = cacheKey(appKey, folderToken);
      const lastRevalidate = revalidatedAt.get(key) ?? 0;
      if (Date.now() - lastRevalidate > REVALIDATE_DEBOUNCE_MS) {
        revalidatedAt.set(key, Date.now());
        background(async () => {
          try {
            await fetchAndStore(folderToken, appKey);
          } catch {
            // Keep serving the stale row; next request tries again.
          }
        });
      }
    }

    if (warmChildren) warmSubfolders(items, appKey);
    return items;
  }

  const items = await fetchAndStore(folderToken, appKey);
  if (warmChildren) warmSubfolders(items, appKey);
  return items;
}

// Pre-populates the cache for subfolders the user can see but hasn't opened.
// Sequential on purpose: this is speculative work competing with real
// user-triggered calls for the same rate-limited Lark app, so it stays a
// trickle rather than a burst. Capped so a folder with 200 subfolders can't
// turn one navigation into 200 upstream calls.
const MAX_WARM_PER_REQUEST = 8;

function warmSubfolders(items: LarkDriveItem[], appKey: string) {
  const subfolders = items.filter((i) => i.type === "folder").slice(0, MAX_WARM_PER_REQUEST);
  if (subfolders.length === 0) return;

  background(async () => {
    const admin = createAdminClient();
    for (const folder of subfolders) {
      const key = cacheKey(appKey, folder.token);
      if (Date.now() - (revalidatedAt.get(key) ?? 0) < REVALIDATE_DEBOUNCE_MS) continue;

      try {
        const { data: existing } = await admin
          .from("lark_drive_cache")
          .select("updated_at")
          .eq("app_key", appKey)
          .eq("folder_token", folder.token)
          .maybeSingle();
        if (existing && Date.now() - new Date(existing.updated_at).getTime() < FRESH_MS) continue;

        revalidatedAt.set(key, Date.now());
        await fetchAndStore(folder.token, appKey);
      } catch {
        // Speculative — a failure here must never surface to the user.
      }
    }
  });
}

// Write-through: call right after the app itself creates a file/folder so it
// shows up in the Drive tab immediately instead of waiting for the next
// refresh — same reasoning as addFoldersToCache in folders.ts, but for full
// listings rather than just the folder tree. A lost update here (two people
// creating into the same folder at the same instant) just means the slower
// write's item appears once the row is next revalidated.
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

// Drops a folder's cached listing so the next read refetches it. Called after
// a mutation whose effect this cache can't derive locally (move/delete), where
// serving the pre-mutation listing would show a file that isn't there anymore.
export async function invalidateDriveCache(appKey: string, folderTokens: (string | null | undefined)[]) {
  const tokens = [...new Set(folderTokens.filter((t): t is string => !!t))];
  if (tokens.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.from("lark_drive_cache").delete().eq("app_key", appKey).in("folder_token", tokens);
    for (const t of tokens) revalidatedAt.delete(cacheKey(appKey, t));
  } catch {
    // Non-fatal — the row just expires naturally instead.
  }
}
