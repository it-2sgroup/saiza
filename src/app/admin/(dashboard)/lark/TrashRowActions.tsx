"use client";

import { useActionState, useState } from "react";
import { restoreLarkDocument, permanentlyDeleteLarkDocument, type RestoreTrashState, type PermanentDeleteState } from "./actions";
import { useToastOnActionState } from "../useToastOnActionState";

const restoreInitial: RestoreTrashState = { error: null };
const purgeInitial: PermanentDeleteState = { error: null };

export function TrashRowActions({ documentId, canManage }: { documentId: string; canManage: boolean }) {
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  const [restoreState, restoreAction, restorePending] = useActionState(restoreLarkDocument.bind(null, documentId), restoreInitial);
  useToastOnActionState(
    restoreState,
    restoreState.done
      ? restoreState.restoredTo === "root"
        ? "Đã khôi phục (thư mục cũ không còn nên đưa về thư mục gốc)."
        : "Đã khôi phục file."
      : null,
  );

  const [purgeState, purgeAction, purgePending] = useActionState(permanentlyDeleteLarkDocument.bind(null, documentId), purgeInitial);
  useToastOnActionState(purgeState, purgeState.done ? "Đã xoá vĩnh viễn." : null);

  if (restoreState.done || purgeState.done) return <span className="text-xs text-ink-2">Đã xử lý.</span>;

  if (!canManage) {
    return <span className="text-xs text-ink-2">Chỉ người đã xoá hoặc quản trị viên mới thao tác được.</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <form action={restoreAction}>
          <button
            type="submit"
            disabled={restorePending || purgePending}
            className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {restorePending ? "Đang khôi phục..." : "Khôi phục"}
          </button>
        </form>

        {!confirmingPurge ? (
          <button
            type="button"
            onClick={() => setConfirmingPurge(true)}
            className="cursor-pointer rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors duration-300 ease-soft hover:bg-red-50"
          >
            Xoá vĩnh viễn
          </button>
        ) : (
          <form action={purgeAction} className="flex items-center gap-1.5">
            <button
              type="submit"
              disabled={purgePending || restorePending}
              className="cursor-pointer rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {purgePending ? "Đang xoá..." : "Chắc chắn xoá?"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingPurge(false)}
              disabled={purgePending}
              className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 hover:border-ink hover:text-ink"
            >
              Huỷ
            </button>
          </form>
        )}
      </div>
      {(restoreState.error || purgeState.error) && (
        <span className="text-xs font-medium text-red-600">{restoreState.error || purgeState.error}</span>
      )}
    </div>
  );
}
