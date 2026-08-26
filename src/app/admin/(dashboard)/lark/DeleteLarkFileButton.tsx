"use client";

import { useActionState, useState } from "react";
import { deleteLarkDocument, type DeleteLarkDocState } from "./actions";
import type { LarkFileType } from "@/lib/lark/fileTypes";

const initialState: DeleteLarkDocState = { error: null };

export function DeleteLarkFileButton({ documentId, fileType = "docx" }: { documentId: string; fileType?: LarkFileType }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteLarkDocument.bind(null, documentId, fileType),
    initialState,
  );

  if (state.done) return <span className="text-xs text-ink-2">Đã xoá.</span>;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-fit cursor-pointer text-xs font-medium text-red-600 hover:text-red-700"
      >
        Xoá file
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2.5">
      <span className="text-xs text-ink-2">Xoá vĩnh viễn khỏi Lark?</span>
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang xoá..." : "Xác nhận xoá"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className="cursor-pointer text-xs font-medium text-ink-2 hover:text-ink"
      >
        Huỷ
      </button>
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
