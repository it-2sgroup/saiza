"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LarkDriveItem } from "@/lib/lark/client";

export const ROOT_KEY = "__root__";

// `fetchedAt: null` marks a listing that came straight from the server render
// for this page load. It has no client-side timestamp (reading a clock during
// render would make the component impure), and it doesn't need one: it is by
// definition the freshest thing available right now.
type Entry = { items: LarkDriveItem[]; fetchedAt: number | null };
type Cache = Record<string, Entry>;

// Below this age a navigation reuses the cached listing outright, with no
// network call at all. Above it the listing is still shown immediately and
// refreshed in the background — the user never waits either way.
const CLIENT_FRESH_MS = 30 * 1000;

// Survives reloads (the "why does it load again when I refresh?" complaint)
// but not a new tab/session, so a stale listing can't outlive the browsing
// session it belongs to. Bounded because sessionStorage is a hard ~5MB.
const STORAGE_PREFIX = "lark-drive-cache:";
const MAX_PERSISTED_FOLDERS = 40;

// The key is scoped by user, not just by Lark app: sessionStorage outlives a
// logout within the same tab, so keying on appKey alone would hand the next
// person to sign in a readable list of the previous user's folder and file
// names. Different scope → different key → they simply see a cold cache.
function storageKey(scope: string) {
  return `${STORAGE_PREFIX}${scope}`;
}

// Speculative fetching is pure overhead for someone on a metered or slow
// connection, so skip it there and let real navigations have the bandwidth.
function prefetchAllowed() {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!conn) return true;
  if (conn.saveData) return false;
  return !(conn.effectiveType === "slow-2g" || conn.effectiveType === "2g");
}

function isFresh(entry: Entry) {
  return entry.fetchedAt === null || Date.now() - entry.fetchedAt < CLIENT_FRESH_MS;
}

function readPersisted(scope: string): Cache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(storageKey(scope));
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function persist(scope: string, cache: Cache) {
  if (typeof window === "undefined") return;
  try {
    // Keep the most recently fetched folders and drop the rest, so long
    // browsing sessions can't grow the entry unboundedly.
    const trimmed = Object.entries(cache)
      .sort((a, b) => (b[1].fetchedAt ?? Infinity) - (a[1].fetchedAt ?? Infinity))
      .slice(0, MAX_PERSISTED_FOLDERS);
    window.sessionStorage.setItem(storageKey(scope), JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // Quota/private-mode — the in-memory cache still works for this page view.
  }
}

/**
 * Client-side folder cache for the Drive browser.
 *
 * The pattern here is what makes Google-Drive-style navigation feel instant,
 * and it's three things working together:
 *
 *  1. **Cache-first render** — a folder you've already opened renders from
 *     memory with no request, so revisits and breadcrumb hops are immediate.
 *  2. **Stale-while-revalidate** — a cached-but-old folder still renders
 *     immediately, and the fresh listing swaps in when it arrives. The old
 *     code threw the rendered rows away and showed "Đang tải…" for the whole
 *     round-trip, which is why every navigation felt slow even on a cache hit.
 *  3. **Prefetch** — subfolders get fetched on hover and shortly after their
 *     parent listing renders, so the click usually lands on a warm cache.
 *
 * `isLoading` is deliberately true *only* when there is nothing to show at
 * all. Anything else renders content, never a spinner.
 */
export function useDriveFolders(appKey: string, cacheScope: string, initialItems?: LarkDriveItem[]) {
  const scope = `${cacheScope}:${appKey}`;
  const [cache, setCache] = useState<Cache>(() => {
    const persisted = readPersisted(scope);
    // Server-rendered root listing wins over anything persisted: it was
    // fetched for this page load, so it's the freshest thing available.
    return initialItems ? { ...persisted, [ROOT_KEY]: { items: initialItems, fetchedAt: null } } : persisted;
  });
  const [pending, setPending] = useState<Record<string, true>>({});
  const [error, setError] = useState<string | null>(null);

  // A mutation (create/move/delete) calls revalidatePath, which re-runs the
  // page's server fetch and hands down a brand-new `initialItems` array. That
  // identity change is our signal that something server-side actually
  // changed, so the root takes the fresh listing and every other folder is
  // dropped — a move, for instance, invalidates both the folder the file left
  // and the one it landed in, and we can't tell which those were from here.
  // Adjusting state during render (not in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect
  const [syncedInitialItems, setSyncedInitialItems] = useState(initialItems);
  if (initialItems && initialItems !== syncedInitialItems) {
    setSyncedInitialItems(initialItems);
    setCache({ [ROOT_KEY]: { items: initialItems, fetchedAt: null } });
  }

  // Coordinates concurrent fetches; must be read at its live value inside
  // async callbacks rather than at the value captured when they were created.
  const inFlight = useRef<Map<string, Promise<void>>>(new Map());

  // Mirrors `cache` for reading inside event handlers, and is the single place
  // persistence happens. Effects flush before the user can interact, so
  // handlers never observe a stale mirror.
  const cacheRef = useRef(cache);
  useEffect(() => {
    cacheRef.current = cache;
    persist(scope, cache);
  }, [cache, scope]);

  /**
   * @param silent Suppresses the error banner. Set for background work the
   *   user didn't ask for (a prefetch, or refreshing a folder that's already
   *   rendering) — failing quietly and keeping the current view is the right
   *   outcome there.
   * @param speculative Tells the server not to also warm this folder's
   *   children, so idle hovering can't fan out into upstream Lark calls.
   */
  const fetchFolder = useCallback(
    (
      key: string,
      folderToken: string | null,
      { silent = false, speculative = false }: { silent?: boolean; speculative?: boolean } = {},
    ) => {
      const existing = inFlight.current.get(key);
      if (existing) return existing;

      const params = new URLSearchParams({ app: appKey });
      if (folderToken) params.set("folder", folderToken);
      if (speculative) params.set("prefetch", "1");

      // Tracked for *every* fetch, prefetches included. Otherwise clicking a
      // folder whose prefetch is still in flight would find no cache entry
      // and no pending flag, and render "Thư mục trống" instead of waiting.
      setPending((p) => ({ ...p, [key]: true }));

      const task = (async () => {
        try {
          const res = await fetch(`/api/lark/drive?${params}`, { cache: "no-store" });
          const body = (await res.json()) as { items?: LarkDriveItem[]; error?: string };
          if (!res.ok || body.error) throw new Error(body.error ?? "Không đọc được thư mục.");

          const items = body.items ?? [];
          setCache((prev) => ({ ...prev, [key]: { items, fetchedAt: Date.now() } }));
          if (!silent) setError(null);
        } catch (err) {
          if (!silent) setError(err instanceof Error ? err.message : "Không đọc được thư mục.");
        } finally {
          inFlight.current.delete(key);
          setPending((p) => {
            const { [key]: _drop, ...rest } = p;
            return rest;
          });
        }
      })();

      inFlight.current.set(key, task);
      return task;
    },
    [appKey],
  );

  /** Navigate to a folder: renders whatever is cached now, refreshes if stale. */
  const open = useCallback(
    (folderToken: string | null) => {
      const key = folderToken ?? ROOT_KEY;
      const entry = cacheRef.current[key];
      setError(null);
      if (entry && isFresh(entry)) return;
      // A stale entry keeps rendering while it refreshes, so that refresh is
      // silent — it surfaces as the subtle "đang làm mới" hint (via
      // isRefreshing) rather than as a spinner or an error banner.
      void fetchFolder(key, folderToken, { silent: !!entry });
    },
    [fetchFolder],
  );

  /**
   * Speculative warm-up for a folder the user might open next.
   *
   * Deliberately only fills gaps: if there's *any* cached entry it does
   * nothing, even a stale one. Prefetching is cache-population, not
   * freshness-enforcement — letting it refresh stale entries too would turn
   * idle hovering into a steady stream of upstream Lark calls competing with
   * real navigations for the same rate limit, for no perceived gain (a stale
   * entry already renders instantly, and `open` revalidates it).
   */
  const prefetch = useCallback(
    (folderToken: string) => {
      if (cacheRef.current[folderToken]) return;
      if (inFlight.current.has(folderToken)) return;
      if (!prefetchAllowed()) return;
      void fetchFolder(folderToken, folderToken, { silent: true, speculative: true });
    },
    [fetchFolder],
  );

  /** Forces the next `open` of these folders to refetch (used after mutations). */
  const invalidate = useCallback((folderTokens: (string | null)[]) => {
    setCache((prev) => {
      const next = { ...prev };
      for (const token of folderTokens) delete next[token ?? ROOT_KEY];
      return next;
    });
  }, []);

  const getItems = useCallback((folderToken: string | null) => cache[folderToken ?? ROOT_KEY]?.items, [cache]);

  /** True only with nothing to show — the one case that warrants a skeleton. */
  const isLoading = useCallback(
    (folderToken: string | null) => {
      const key = folderToken ?? ROOT_KEY;
      return !!pending[key] && !cache[key];
    },
    [pending, cache],
  );

  /**
   * True while a listing that IS already on screen is being refreshed. Worth
   * surfacing subtly: without it, someone looking at a stale listing has no
   * way to tell the rows might be a few seconds out of date, and could act on
   * a file another person already moved.
   */
  const isRefreshing = useCallback(
    (folderToken: string | null) => {
      const key = folderToken ?? ROOT_KEY;
      return !!pending[key] && !!cache[key];
    },
    [pending, cache],
  );

  return { cache, getItems, isLoading, isRefreshing, error, open, prefetch, invalidate };
}
