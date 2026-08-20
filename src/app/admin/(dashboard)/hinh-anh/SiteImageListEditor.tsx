"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  addSiteImageItem,
  replaceSiteImageItem,
  deleteSiteImageItem,
  type SiteImageItemState,
} from "./actions";

const initialState: SiteImageItemState = { error: null, success: false };

type ListItem = { id: string; url: string; label: string | null };

export function SiteImageListEditor({
  listKey,
  items,
  withLabel = false,
  addLabel = "Thêm ảnh",
}: {
  listKey: string;
  items: ListItem[];
  withLabel?: boolean;
  addLabel?: string;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
      {items.map((item) => (
        <ExistingItemCard key={item.id} id={item.id} listKey={listKey} url={item.url} label={item.label} />
      ))}
      <AddItemTile listKey={listKey} withLabel={withLabel} addLabel={addLabel} />
    </div>
  );
}

function ExistingItemCard({
  id,
  listKey,
  url,
  label,
}: {
  id: string;
  listKey: string;
  url: string;
  label: string | null;
}) {
  const [state, formAction, pending] = useActionState(replaceSiteImageItem.bind(null, id, listKey), initialState);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-card border border-line bg-card p-4">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-wash">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary external/Storage host */}
        <img src={url} alt={label ?? ""} className="h-full w-full object-cover" />
      </div>
      {label && (
        <span className="truncate text-sm font-medium" title={label}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="flex-1 cursor-pointer rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang tải lên..." : "Đổi ảnh"}
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            setDeleteError(null);
            startDelete(async () => {
              const result = await deleteSiteImageItem(id, listKey);
              if (result.error) setDeleteError(result.error);
            });
          }}
          title="Xoá"
          className="cursor-pointer rounded-full border border-line px-3 py-2 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "..." : "Xoá"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      />
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
      {deleteError && <span className="text-xs font-medium text-red-600">{deleteError}</span>}
    </form>
  );
}

function AddItemTile({
  listKey,
  withLabel,
  addLabel,
}: {
  listKey: string;
  withLabel: boolean;
  addLabel: string;
}) {
  const [state, formAction, pending] = useActionState(addSiteImageItem.bind(null, listKey), initialState);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!withLabel) {
    return (
      <form action={formAction} className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label={addLabel}
          className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-ink-2 transition-colors duration-300 ease-soft hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="text-2xl leading-none">{pending ? "..." : "+"}</span>
          <span className="text-xs font-medium">{addLabel}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
        />
        {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
      </form>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-card border-2 border-dashed border-line p-4">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={addLabel}
          className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl text-ink-2 transition-colors duration-300 ease-soft hover:text-accent"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-xs font-medium">{addLabel}</span>
        </button>
      ) : (
        <>
          <input
            name="label"
            required
            placeholder="Tên"
            className="rounded-[10px] border border-line bg-paper px-3 py-2 text-sm outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="cursor-pointer rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang tải lên..." : "Chọn ảnh"}
          </button>
          <input
            ref={inputRef}
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          />
        </>
      )}
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
