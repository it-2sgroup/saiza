"use client";

import { useActionState, useState } from "react";
import { shareExistingDocument, type ShareExistingState } from "./actions";
import {
  StaffSharePicker,
  type StaffOption,
  type ShareRow,
} from "./StaffSharePicker";
import { Btn, cardClasses } from "../controls";
import type { LarkFileType } from "@/lib/lark/client";
import { useToastOnActionState } from "../useToastOnActionState";

const initialState: ShareExistingState = { error: null };

export function ShareExistingDoc({
  documentId,
  fileType = "docx",
  staff,
  variant = "link",
  embedded = false,
}: {
  documentId: string;
  fileType?: LarkFileType;
  staff: StaffOption[];
  variant?: "link" | "button";
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [state, formAction, pending] = useActionState(
    shareExistingDocument.bind(null, documentId, fileType),
    initialState,
  );
  useToastOnActionState(
    state,
    state.shareResults
      ? state.shareResults.every((r) => r.ok)
        ? "Đã chia sẻ thành công."
        : "Đã chia sẻ, nhưng một số người không nhận được — kiểm tra lại email."
      : null,
  );

  // `variant` used to switch between a pill button and bare accent text; both
  // are real buttons now, so it only picks the emphasis level.
  const triggerVariant = variant === "button" ? "secondary" : "ghost";

  const form = (
    <form
      action={formAction}
      className={`flex flex-col gap-2.5 p-3 ${cardClasses}`}
    >
      <StaffSharePicker
        staff={staff}
        hiddenFieldName="shares"
        value={shares}
        onChange={setShares}
      />
      {state.error && (
        <p className="text-xs font-medium text-red-600">{state.error}</p>
      )}
      {state.shareResults && (
        <div className="flex flex-col gap-0.5">
          {state.shareResults.map((r) => (
            <span key={r.email} className="text-xs text-ink-2">
              {r.ok ? "✓" : "✗"} {r.email}
            </span>
          ))}
        </div>
      )}
      <Btn
        type="submit"
        variant="primary"
        size="sm"
        disabled={pending || shares.length === 0}
        className="w-fit"
      >
        {pending ? "Đang chia sẻ..." : "Chia sẻ"}
      </Btn>
    </form>
  );

  if (embedded) return form;

  return (
    <div className="flex flex-col gap-2.5">
      <Btn
        variant={triggerVariant}
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="w-fit"
      >
        {open ? "Đóng" : "Chia sẻ"}
      </Btn>
      {open && form}
    </div>
  );
}
