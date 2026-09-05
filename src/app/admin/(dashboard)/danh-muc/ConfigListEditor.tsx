"use client";

import { useActionState, useState } from "react";
import { addConfigOptionAction, renameConfigOptionAction, removeConfigOptionAction } from "./actions";
import { useToastOnActionState } from "../useToastOnActionState";
import type { ConfigListKey, ConfigListMutationState, ConfigOption } from "@/lib/admin/configLists";

const initialState: ConfigListMutationState = { error: null };
const fieldClasses =
  "rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

function AddRow({ listKey }: { listKey: ConfigListKey }) {
  const [state, formAction, pending] = useActionState(addConfigOptionAction, initialState);
  useToastOnActionState(state, state.success ? "Đã thêm." : null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      action={(fd) => {
        formAction(fd);
        setCode("");
        setLabel("");
        setNote("");
      }}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-3"
    >
      <input type="hidden" name="listKey" value={listKey} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_1fr]">
        <input
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã (VD: MKT2)"
          required
          className={fieldClasses}
        />
        <input
          name="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Tên hiển thị"
          required
          className={fieldClasses}
        />
        <input
          name="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (không bắt buộc)"
          className={fieldClasses}
        />
      </div>
      {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit cursor-pointer rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang thêm..." : "+ Thêm mục"}
      </button>
    </form>
  );
}

function OptionRow({ listKey, option }: { listKey: ConfigListKey; option: ConfigOption }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [renameState, renameAction, renamePending] = useActionState(renameConfigOptionAction, initialState);
  useToastOnActionState(renameState, renameState.success ? "Đã lưu." : null);
  const [removeState, setRemoveState] = useState<ConfigListMutationState>(initialState);
  const [removing, setRemoving] = useState(false);

  // Closes the inline edit form once the save succeeds. Tracked against the
  // last-handled state object (not just `.success`) so this only fires once
  // per action dispatch — `renameState.success` alone would stay true forever
  // after the first success and re-trigger setEditing(false) on every render.
  const [handledRenameState, setHandledRenameState] = useState(renameState);
  if (renameState !== handledRenameState) {
    setHandledRenameState(renameState);
    if (renameState.success) setEditing(false);
  }

  if (editing) {
    return (
      <form action={renameAction} className="flex flex-col gap-2 rounded-xl border border-accent/40 bg-wash/40 p-3">
        <input type="hidden" name="listKey" value={listKey} />
        <input type="hidden" name="code" value={option.code} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input name="label" defaultValue={option.label} required className={fieldClasses} />
          <input name="note" defaultValue={option.note ?? ""} placeholder="Ghi chú" className={fieldClasses} />
        </div>
        {renameState.error && <p className="text-xs font-medium text-red-600">{renameState.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={renamePending}
            className="cursor-pointer rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {renamePending ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Huỷ
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
          <span className="rounded-full bg-wash px-2 py-0.5 text-[11px] font-semibold text-ink-2">{option.code}</span>
          {option.label}
        </span>
        {option.note && <span className="truncate text-xs text-ink-2">{option.note}</span>}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {confirming ? (
          <>
            <span className="text-xs text-ink-2">Xoá mục này?</span>
            <button
              type="button"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                const result = await removeConfigOptionAction(listKey, option.code);
                setRemoving(false);
                setRemoveState(result);
                if (!result.error) setConfirming(false);
              }}
              className="cursor-pointer rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? "..." : "Xác nhận"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2 hover:border-ink hover:text-ink"
            >
              Huỷ
            </button>
          </>
        ) : (
          <>
            {removeState.error && <span className="text-xs font-medium text-red-600">{removeState.error}</span>}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
            >
              Sửa
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="cursor-pointer rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-300 ease-soft hover:bg-red-50"
            >
              Xoá
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ConfigListEditor({ listKey, options }: { listKey: ConfigListKey; options: ConfigOption[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {options.length === 0 ? (
        <p className="text-sm text-ink-2">Chưa có mục nào.</p>
      ) : (
        options.map((o) => <OptionRow key={o.code} listKey={listKey} option={o} />)
      )}
      <AddRow listKey={listKey} />
    </div>
  );
}
