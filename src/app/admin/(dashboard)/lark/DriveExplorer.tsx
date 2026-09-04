"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal, ModalHeader } from "../Modal";
import type { LarkDriveItem, LarkFileType } from "@/lib/lark/client";
import type { FolderOption } from "@/lib/lark/folders";
import { TypeBadge, fileTypeLabel } from "./TypeBadge";
import { ItemActionsMenu } from "./ItemActionsMenu";
import type { StaffOption } from "./StaffSharePicker";
import { useDriveFolders, ROOT_KEY } from "./useDriveFolders";

type Crumb = { token: string | null; name: string };

// Sentinel parentToken for folders discovered directly under the app's root
// (browsed with token=null) — the server's own root folder token isn't
// exposed to this component, so this just needs to be a value that never
// collides with a real Lark token, not match anything specific.
const ROOT_PARENT = "";

// Reconstructs the ancestor chain (for the breadcrumb) for a folder clicked
// directly in the tree sidebar, since FolderOption only carries a
// `parentToken` pointer, not the full path.
function buildPathTo(token: string, tree: FolderOption[], rootLabel: string): Crumb[] {
  const byToken = new Map(tree.map((f) => [f.token, f]));
  const chain: Crumb[] = [];
  let current = byToken.get(token);
  while (current) {
    chain.unshift({ token: current.token, name: current.name });
    current = current.parentToken ? byToken.get(current.parentToken) : undefined;
  }
  return [{ token: null, name: rootLabel }, ...chain];
}

// Placeholder rows for a folder we have genuinely never fetched. A skeleton
// that matches the real row height keeps the layout from jumping, which reads
// as faster than a centred "Đang tải…" even at identical latency.
//
// The fade-in is delayed rather than gated on a timer in state: a warm folder
// resolves fast enough that a skeleton flashing for ~80ms reads as a glitch,
// but expressing "invisible for the first 150ms" as an animation delay keeps
// it out of React's render path entirely.
function SkeletonRows() {
  return (
    <div
      className="flex flex-col divide-y divide-line rounded-card border border-line"
      style={{ animation: `softIn 0.2s ease ${SKELETON_DELAY_MS}ms both` }}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
          <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-md bg-wash" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="h-3 animate-pulse rounded bg-wash" style={{ width: `${52 - i * 8}%` }} />
            <div className="h-2.5 w-20 animate-pulse rounded bg-wash" />
          </div>
        </div>
      ))}
    </div>
  );
}

// A cold folder resolves fast enough (warm Postgres row) that flashing a
// skeleton for ~80ms reads as a glitch rather than as progress. Only commit
// to showing one if the fetch is still outstanding after this.
const SKELETON_DELAY_MS = 150;

export function DriveExplorer({
  appKey,
  appLabel,
  cacheScope,
  folderTree = [],
  trigger,
  inline = false,
  initialItems,
  staff,
  folderOptions,
}: {
  appKey: string;
  appLabel: string;
  // Identifies whose cache this is (the signed-in user). Folder/file names
  // get persisted to sessionStorage, which outlives a logout in the same tab,
  // so the key has to change when the user does.
  cacheScope: string;
  folderTree?: FolderOption[];
  trigger?: React.ReactNode;
  inline?: boolean;
  // Server-fetched root listing (page.tsx) so the inline Drive tab shows
  // content immediately on first render instead of a skeleton. Its identity
  // changing is also how useDriveFolders learns a mutation happened.
  initialItems?: LarkDriveItem[];
  // Lets Drive-tab rows carry the same "..." menu (share/move/transfer/
  // delete) as every other file list.
  staff: StaffOption[];
  folderOptions: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<Crumb[]>([{ token: null, name: appLabel }]);
  const { cache, getItems, isLoading, isRefreshing, error, open: openFolder, prefetch } = useDriveFolders(appKey, cacheScope, initialItems);

  const currentToken = path[path.length - 1]?.token ?? null;
  const items = getItems(currentToken);
  const loading = isLoading(currentToken);
  const refreshing = isRefreshing(currentToken);

  // The server-computed folderTree is cached and can lag behind reality, so
  // the sidebar also shows every folder we've actually seen in a listing.
  // Derived straight from the fetch cache rather than accumulated in its own
  // state: the cache is already keyed by parent token, so a breadth-first
  // walk of it *is* the tree. That also means prefetched-but-never-opened
  // subfolders show up in the sidebar for free.
  const liveFolders = useMemo(() => {
    const out: FolderOption[] = [];
    const seen = new Set<string>();
    const queue: { key: string; depth: number }[] = [{ key: ROOT_KEY, depth: 0 }];
    while (queue.length > 0) {
      const { key, depth } = queue.shift()!;
      for (const item of cache[key]?.items ?? []) {
        if (item.type !== "folder" || seen.has(item.token)) continue;
        seen.add(item.token);
        out.push({
          token: item.token,
          name: item.name,
          depth: depth + 1,
          parentToken: key === ROOT_KEY ? ROOT_PARENT : key,
        });
        queue.push({ key: item.token, depth: depth + 1 });
      }
    }
    return out;
  }, [cache]);

  // Warm the subfolders of whatever is on screen. Deferred so it never
  // competes with rendering the listing the user is actually looking at, and
  // the hook itself skips anything already cached or in flight.
  useEffect(() => {
    if (!items) return;
    const subfolders = items.filter((i) => i.type === "folder").slice(0, 6);
    if (subfolders.length === 0) return;
    const id = window.setTimeout(() => subfolders.forEach((f) => prefetch(f.token)), 400);
    return () => window.clearTimeout(id);
  }, [items, prefetch]);

  // Root listing on first mount. `openFolder` no-ops when the SSR-provided
  // `initialItems` is still fresh, so this costs nothing in the normal case
  // and only actually fetches when the server-side fetch was skipped/failed.
  useEffect(() => {
    if (inline) openFolder(null);
  }, [inline, openFolder]);

  const tree = useMemo(() => {
    const byToken = new Map<string, FolderOption>();
    for (const f of folderTree) byToken.set(f.token, f);
    for (const f of liveFolders) byToken.set(f.token, f);
    return [...byToken.values()].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name, "vi"));
  }, [folderTree, liveFolders]);

  const openExplorer = () => {
    setPath([{ token: null, name: appLabel }]);
    setOpen(true);
    openFolder(null);
  };

  const enterFolder = (item: LarkDriveItem) => {
    setPath((p) => [...p, { token: item.token, name: item.name }]);
    openFolder(item.token);
  };

  const goToCrumb = (index: number) => {
    setPath((p) => p.slice(0, index + 1));
    openFolder(path[index].token);
  };

  const goToTreeItem = (folder: FolderOption | null) => {
    if (folder === null) {
      setPath([{ token: null, name: appLabel }]);
      openFolder(null);
    } else {
      setPath(buildPathTo(folder.token, tree, appLabel));
      openFolder(folder.token);
    }
  };

  // Inline mode has its own tree sidebar for folder navigation, so the
  // content pane only needs to list folders the tree doesn't already show
  // — anything in `tree` would otherwise show up twice.
  const treeTokens = new Set(tree.map((f) => f.token));
  const visibleFolders = (items ?? []).filter((i) => i.type === "folder" && (!inline || !treeTokens.has(i.token)));
  const orderedItems = [...visibleFolders, ...(items ?? []).filter((i) => i.type !== "folder")];

  const driveIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2Z" />
    </svg>
  );

  const treeItemClass = (active: boolean) =>
    `flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-300 ease-soft ${
      active ? "bg-accent/10 text-accent" : "text-ink-2 hover:bg-wash hover:text-ink"
    }`;

  const content = (
    <div className={inline ? "flex flex-col gap-3 sm:flex-row sm:gap-5" : "flex min-h-0 flex-1 flex-col gap-3"}>
      {inline && (
        <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:w-[220px]">
          <h3 className="text-[11px] font-semibold tracking-[0.06em] text-ink-2 uppercase">Cây thư mục</h3>
          <div className="flex flex-col gap-0.5 rounded-card border border-line bg-card p-1.5">
            <button type="button" onClick={() => goToTreeItem(null)} className={treeItemClass(currentToken === null)}>
              <span className="truncate">{appLabel}</span>
            </button>
            {tree.map((f) => (
              <button
                key={f.token}
                type="button"
                onClick={() => goToTreeItem(f)}
                onMouseEnter={() => prefetch(f.token)}
                onFocus={() => prefetch(f.token)}
                style={{ paddingLeft: `${f.depth * 14 + 10}px` }}
                className={treeItemClass(currentToken === f.token)}
              >
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={inline ? "flex min-w-0 flex-1 flex-col gap-3" : "flex min-h-0 flex-1 flex-col gap-3"}>
        {!inline && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-1 text-sm">
            {path.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-ink-2">/</span>}
                <button
                  type="button"
                  onClick={() => goToCrumb(i)}
                  disabled={i === path.length - 1}
                  className={i === path.length - 1 ? "font-semibold text-ink" : "cursor-pointer text-accent hover:text-ink"}
                >
                  {c.name}
                </button>
              </span>
            ))}
          </div>
        )}

        {inline && (
          <div className="flex flex-shrink-0 flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[14.5px] font-semibold text-ink">
              {path.length <= 1 ? `${appLabel} / Toàn bộ nội dung` : path.map((c) => c.name).join(" / ")}
            </h3>
            <span className="flex items-center gap-2 text-xs text-ink-2">
              {refreshing && (
                <span className="flex items-center gap-1.5 text-accent">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                  Đang làm mới
                </span>
              )}
              Gồm cả file có trước khi hệ thống tồn tại
            </span>
          </div>
        )}

        <div className={inline ? "" : "min-h-0 flex-1 overflow-y-auto"}>
          {error && !items ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : loading ? (
            <SkeletonRows />
          ) : orderedItems.length === 0 ? (
            <p className="text-sm text-ink-2">Thư mục trống.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line rounded-card border border-line">
              {orderedItems.map((f) =>
                f.type === "folder" ? (
                  <div
                    key={f.token}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-300 ease-soft hover:bg-wash"
                    onMouseEnter={() => prefetch(f.token)}
                  >
                    <button
                      type="button"
                      onClick={() => enterFolder(f)}
                      onFocus={() => prefetch(f.token)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                    >
                      <TypeBadge type={f.type} size="sm" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[14px] font-medium">{f.name}</span>
                        <span className="text-xs text-ink-2">{fileTypeLabel(f.type)}</span>
                      </div>
                    </button>
                    <ItemActionsMenu
                      documentId={f.token}
                      fileType={f.type as LarkFileType}
                      url={f.url}
                      staff={staff}
                      folderOptions={folderOptions}
                    />
                  </div>
                ) : (
                  <div key={f.token} className="flex items-center gap-3 px-4 py-2.5">
                    <TypeBadge type={f.type} size="sm" />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[14px] font-medium">{f.name}</span>
                      <span className="text-xs text-ink-2">{fileTypeLabel(f.type)}</span>
                    </div>
                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 text-xs font-medium text-accent hover:text-ink"
                      >
                        Mở →
                      </a>
                    )}
                    <ItemActionsMenu
                      documentId={f.token}
                      fileType={f.type as LarkFileType}
                      url={f.url}
                      staff={staff}
                      folderOptions={folderOptions}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <>
      {trigger ? (
        <span className="contents" onClick={openExplorer}>
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={openExplorer}
          title="Duyệt Drive"
          aria-label="Duyệt Drive"
          className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {driveIcon}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        panelClassName="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden p-6"
      >
        <ModalHeader
          title={`Duyệt Drive — ${appLabel}`}
          subtitle="Xem toàn bộ thư mục và file thật trong Lark, kể cả file có từ trước khi hệ thống này tồn tại."
          onClose={() => setOpen(false)}
        />
        {content}
      </Modal>
    </>
  );
}
