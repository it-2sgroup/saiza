"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Modal, ModalHeader } from "../Modal";
import { browseLarkFolder } from "./actions";
import type { LarkDriveItem, LarkFileType } from "@/lib/lark/client";
import type { FolderOption } from "@/lib/lark/folders";
import { TypeBadge, fileTypeLabel } from "./TypeBadge";
import { ItemActionsMenu } from "./ItemActionsMenu";
import type { StaffOption } from "./StaffSharePicker";

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

export function DriveExplorer({
  appKey,
  appLabel,
  folderTree = [],
  trigger,
  inline = false,
  initialItems,
  staff,
  folderOptions,
}: {
  appKey: string;
  appLabel: string;
  folderTree?: FolderOption[];
  trigger?: React.ReactNode;
  inline?: boolean;
  // Server-fetched root listing (page.tsx) so the inline Drive tab shows
  // content immediately on first render instead of "Đang tải...". Only
  // valid for the root of `appKey` — the parent remounts this component
  // (via `key={appKey}`) whenever the active app changes, so a stale prop
  // from a previous app can never leak into a fresh instance.
  initialItems?: LarkDriveItem[];
  // Lets Drive-tab rows carry the same "..." menu (share/move/transfer/
  // delete) as every other file list — previously the Drive tab only had
  // "Mở →", so a file that only ever showed up here (browsed to, not
  // created via this app's own history) had no way to be moved at all.
  staff: StaffOption[];
  folderOptions: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<Crumb[]>([{ token: null, name: appLabel }]);
  const [items, setItems] = useState<LarkDriveItem[]>(initialItems ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // The server-computed folderTree is cached and can lag behind reality —
  // every live browse also folds any folders it sees into this, so the
  // sidebar is always at least as complete as what you've actually visited.
  const [liveFolders, setLiveFolders] = useState<FolderOption[]>(() =>
    (initialItems ?? [])
      .filter((i) => i.type === "folder")
      .map((i) => ({ token: i.token, name: i.name, depth: 1, parentToken: ROOT_PARENT })),
  );

  const tree = useMemo(() => {
    const byToken = new Map<string, FolderOption>();
    for (const f of folderTree) byToken.set(f.token, f);
    for (const f of liveFolders) byToken.set(f.token, f);
    return [...byToken.values()].sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name, "vi"));
  }, [folderTree, liveFolders]);

  const load = (token: string | null, depth: number) => {
    startTransition(async () => {
      const res = await browseLarkFolder(token, appKey);
      if (res.error) {
        setError(res.error);
        setItems([]);
      } else {
        setError(null);
        setItems(res.items ?? []);
        const discovered: FolderOption[] = (res.items ?? [])
          .filter((i) => i.type === "folder")
          .map((i) => ({ token: i.token, name: i.name, depth: depth + 1, parentToken: token ?? ROOT_PARENT }));
        if (discovered.length > 0) {
          setLiveFolders((prev) => {
            const known = new Set(prev.map((f) => f.token));
            const additions = discovered.filter((f) => !known.has(f.token));
            return additions.length > 0 ? [...prev, ...additions] : prev;
          });
        }
      }
    });
  };

  const openExplorer = () => {
    setPath([{ token: null, name: appLabel }]);
    setOpen(true);
    load(null, 0);
  };

  useEffect(() => {
    if (!inline || initialItems) return;
    // Only reached when the server-side fetch in page.tsx failed/was skipped
    // — normally `initialItems` already has the root listing, and this
    // component remounts fresh (via `key={appKey}`) on every app switch, so
    // there's no "whenever the active app changes" case left to handle here.
    load(null, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inline]);

  // Creating/moving/deleting a file calls revalidatePath, which makes
  // page.tsx re-run its data fetch and pass a fresh `initialItems` array —
  // but this component's own `items` state was only ever seeded from that
  // prop once, at mount, so it used to keep showing the old listing until a
  // full page reload. "Adjust state on prop change" during render (not in an
  // effect, per https://react.dev/learn/you-might-not-need-an-effect) — only
  // while sitting at the root, so a background root refresh never clobbers
  // someone who's navigated into a subfolder.
  const [syncedInitialItems, setSyncedInitialItems] = useState(initialItems);
  if (inline && initialItems && initialItems !== syncedInitialItems && path.length === 1) {
    setSyncedInitialItems(initialItems);
    setItems(initialItems);
    const discovered: FolderOption[] = initialItems
      .filter((i) => i.type === "folder")
      .map((i) => ({ token: i.token, name: i.name, depth: 1, parentToken: ROOT_PARENT }));
    if (discovered.length > 0) {
      const known = new Map(liveFolders.map((f) => [f.token, f]));
      for (const f of discovered) known.set(f.token, f);
      setLiveFolders([...known.values()]);
    }
  }

  const enterFolder = (item: LarkDriveItem) => {
    const depth = path.length;
    setPath((p) => [...p, { token: item.token, name: item.name }]);
    load(item.token, depth);
  };

  const goToCrumb = (index: number) => {
    setPath((p) => p.slice(0, index + 1));
    load(path[index].token, index);
  };

  const goToTreeItem = (folder: FolderOption | null) => {
    if (folder === null) {
      setPath([{ token: null, name: appLabel }]);
      load(null, 0);
    } else {
      setPath(buildPathTo(folder.token, tree, appLabel));
      load(folder.token, folder.depth);
    }
  };

  const currentToken = path[path.length - 1]?.token ?? null;
  // Inline mode has its own tree sidebar for folder navigation, so the
  // content pane only needs to list folders the tree doesn't already show
  // — anything in `tree` would otherwise show up twice.
  const treeTokens = new Set(tree.map((f) => f.token));
  const visibleFolders = items.filter((i) => i.type === "folder" && (!inline || !treeTokens.has(i.token)));
  const orderedItems = [...visibleFolders, ...items.filter((i) => i.type !== "folder")];

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
            <span className="text-xs text-ink-2">Gồm cả file có trước khi hệ thống tồn tại</span>
          </div>
        )}

        <div className={inline ? "" : "min-h-0 flex-1 overflow-y-auto"}>
          {pending ? (
            <p className="text-sm text-ink-2">Đang tải...</p>
          ) : error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : orderedItems.length === 0 ? (
            <p className="text-sm text-ink-2">Thư mục trống.</p>
          ) : (
            <div className="flex flex-col divide-y divide-line rounded-card border border-line">
              {orderedItems.map((f) =>
                f.type === "folder" ? (
                  <div key={f.token} className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-300 ease-soft hover:bg-wash">
                    <button
                      type="button"
                      onClick={() => enterFolder(f)}
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
