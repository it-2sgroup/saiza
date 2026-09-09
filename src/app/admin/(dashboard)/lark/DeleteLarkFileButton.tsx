"use client";

import { useActionState, useState } from "react";
import { deleteLarkDocument, type DeleteLarkDocState } from "./actions";
import type { LarkFileType } from "@/lib/lark/fileTypes";
import { Btn } from "../controls";
import { useToastOnActionState } from "../useToastOnActionState";

const initialState: DeleteLarkDocState = { error: null };

export function DeleteLarkFileButton({
  documentId,
  fileType = "docx",
  embedded = false,
}: {
  documentId: string;
  fileType?: LarkFileType;
  // Still accepted so callers don't have to change, but no longer read: the
  // "link" presentation was bare red text with an onClick, and both cases now
  // render the same `danger` Btn.
  variant?: "link" | "button";
  embedded?: boolean;
}) {
  const [confirming, setConfirming] = useState(embedded);
  const [state, formAction, pending] = useActionState(
    deleteLarkDocument.bind(null, documentId, fileType),
    initialState,
  );
  useToastOnActionState(
    state,
    state.done
      ? "Đã chuyển vào thùng rác. Có thể khôi phục trong 30 ngày."
      : null,
  );

  if (state.done)
    return <span className="text-xs text-ink-2">Đã chuyển vào thùng rác.</span>;

  const isFolder = fileType === "folder";

  if (!confirming) {
    return (
      <Btn
        variant="danger"
        size="sm"
        onClick={() => setConfirming(true)}
        className="w-fit"
      >
        {isFolder ? "Xoá thư mục" : "Xoá file"}
      </Btn>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      {/* Keep the 30-day retention note: it's what makes "xoá" reversible. */}
      <span className="text-xs text-ink-2">
        Vào thùng rác, khôi phục được trong 30 ngày.
      </span>
      <Btn type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "Đang xoá..." : "Xoá"}
      </Btn>
      {!embedded && (
        <Btn
          variant="secondary"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Huỷ
        </Btn>
      )}
      {state.error && (
        <span className="text-xs font-medium text-red-600">{state.error}</span>
      )}
    </form>
  );
}
