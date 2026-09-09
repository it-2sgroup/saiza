"use client";

import { useActionState, useState } from "react";
import {
  restoreLarkDocument,
  permanentlyDeleteLarkDocument,
  type RestoreTrashState,
  type PermanentDeleteState,
} from "./actions";
import { Btn } from "../controls";
import { useToastOnActionState } from "../useToastOnActionState";

const restoreInitial: RestoreTrashState = { error: null };
const purgeInitial: PermanentDeleteState = { error: null };

export function TrashRowActions({
  documentId,
  canManage,
}: {
  documentId: string;
  canManage: boolean;
}) {
  const [confirmingPurge, setConfirmingPurge] = useState(false);

  const [restoreState, restoreAction, restorePending] = useActionState(
    restoreLarkDocument.bind(null, documentId),
    restoreInitial,
  );
  useToastOnActionState(
    restoreState,
    restoreState.done
      ? restoreState.restoredTo === "root"
        ? "Đã khôi phục (thư mục cũ không còn nên đưa về thư mục gốc)."
        : "Đã khôi phục file."
      : null,
  );

  const [purgeState, purgeAction, purgePending] = useActionState(
    permanentlyDeleteLarkDocument.bind(null, documentId),
    purgeInitial,
  );
  useToastOnActionState(
    purgeState,
    purgeState.done ? "Đã xoá vĩnh viễn." : null,
  );

  if (restoreState.done || purgeState.done)
    return <span className="text-xs text-ink-2">Đã xử lý.</span>;

  if (!canManage) {
    return (
      <span className="text-xs text-ink-2">
        Chỉ người đã xoá hoặc quản trị viên thao tác được.
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <form action={restoreAction}>
          <Btn
            type="submit"
            variant="secondary"
            size="sm"
            disabled={restorePending || purgePending}
          >
            {restorePending ? "Đang khôi phục..." : "Khôi phục"}
          </Btn>
        </form>

        {!confirmingPurge ? (
          <Btn
            variant="danger"
            size="sm"
            onClick={() => setConfirmingPurge(true)}
          >
            Xoá vĩnh viễn
          </Btn>
        ) : (
          <form action={purgeAction} className="flex items-center gap-2">
            <Btn
              type="submit"
              variant="danger"
              size="sm"
              disabled={purgePending || restorePending}
            >
              {purgePending ? "Đang xoá..." : "Chắc chắn xoá?"}
            </Btn>
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => setConfirmingPurge(false)}
              disabled={purgePending}
            >
              Huỷ
            </Btn>
          </form>
        )}
      </div>
      {(restoreState.error || purgeState.error) && (
        <span className="text-xs font-medium text-red-600">
          {restoreState.error || purgeState.error}
        </span>
      )}
    </div>
  );
}
