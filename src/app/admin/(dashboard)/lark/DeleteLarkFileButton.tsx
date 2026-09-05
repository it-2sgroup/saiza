"use client";

import { useActionState, useState } from "react";
import { deleteLarkDocument, type DeleteLarkDocState } from "./actions";
import type { LarkFileType } from "@/lib/lark/fileTypes";
import { useToastOnActionState } from "../useToastOnActionState";

const initialState: DeleteLarkDocState = { error: null };

export function DeleteLarkFileButton({
  documentId,
  fileType = "docx",
  variant = "link",
  embedded = false,
}: {
  documentId: string;
  fileType?: LarkFileType;
  variant?: "link" | "button";
  embedded?: boolean;
}) {
  const [confirming, setConfirming] = useState(embedded);
  const [state, formAction, pending] = useActionState(deleteLarkDocument.bind(null, documentId, fileType), initialState);
  useToastOnActionState(state, state.done ? "Đã chuyển vào thùng rác. Có thể khôi phục trong 30 ngày." : null);

  const triggerClassName =
    variant === "button"
      ? "w-fit cursor-pointer rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors duration-300 ease-soft hover:bg-red-50"
      : "w-fit cursor-pointer text-xs font-medium text-red-600 hover:text-red-700";
  const confirmClassName =
    variant === "button"
      ? "cursor-pointer rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      : "cursor-pointer text-xs font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60";
  const cancelClassName =
    variant === "button"
      ? "cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
      : "cursor-pointer text-xs font-medium text-ink-2 hover:text-ink";

  if (state.done) return <span className="text-xs text-ink-2">Đã chuyển vào thùng rác.</span>;

  const isFolder = fileType === "folder";

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className={triggerClassName}>
        {isFolder ? "Xoá thư mục" : "Xoá file"}
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2.5">
      <span className="text-xs text-ink-2">
        {isFolder ? "Chuyển thư mục này vào thùng rác?" : "Chuyển file này vào thùng rác?"} Có thể khôi phục trong 30 ngày.
      </span>
      <button type="submit" disabled={pending} className={confirmClassName}>
        {pending ? "Đang chuyển..." : "Chuyển vào thùng rác"}
      </button>
      {!embedded && (
        <button type="button" onClick={() => setConfirming(false)} disabled={pending} className={cancelClassName}>
          Huỷ
        </button>
      )}
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}
