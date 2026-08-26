"use client";

import { useActionState, useState } from "react";
import { shareExistingDocument, type ShareExistingState } from "./actions";
import { StaffSharePicker, type StaffOption, type ShareRow } from "./StaffSharePicker";
import type { LarkFileType } from "@/lib/lark/client";

const initialState: ShareExistingState = { error: null };

export function ShareExistingDoc({
  documentId,
  fileType = "docx",
  staff,
}: {
  documentId: string;
  fileType?: LarkFileType;
  staff: StaffOption[];
}) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [state, formAction, pending] = useActionState(
    shareExistingDocument.bind(null, documentId, fileType),
    initialState,
  );

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-fit cursor-pointer text-xs font-medium text-accent hover:text-ink"
      >
        {open ? "Đóng" : "Chia sẻ thêm →"}
      </button>
      {open && (
        <form action={formAction} className="flex flex-col gap-2.5 rounded-xl border border-line bg-paper p-3">
          <StaffSharePicker staff={staff} hiddenFieldName="shares" value={shares} onChange={setShares} />
          {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
          {state.shareResults && (
            <div className="flex flex-col gap-0.5">
              {state.shareResults.map((r) => (
                <span key={r.email} className="text-xs text-ink-2">
                  {r.ok ? "✓" : "✗"} {r.email}
                </span>
              ))}
            </div>
          )}
          <button
            type="submit"
            disabled={pending || shares.length === 0}
            className="w-fit cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang chia sẻ..." : "Chia sẻ"}
          </button>
        </form>
      )}
    </div>
  );
}
