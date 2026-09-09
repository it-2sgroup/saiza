"use client";

import { useActionState, useState } from "react";
import { transferLarkDocumentOwner, type TransferOwnerState } from "./actions";
import type { LarkFileType } from "@/lib/lark/client";
import type { StaffOption } from "./StaffSharePicker";
import { PeoplePicker } from "./PeoplePicker";
import { Btn, inputClasses, cardClasses } from "../controls";
import { useToastOnActionState } from "../useToastOnActionState";

const initialState: TransferOwnerState = { error: null };

export function TransferOwnerButton({
  documentId,
  fileType = "docx",
  staff = [],
  variant = "link",
  embedded = false,
}: {
  documentId: string;
  fileType?: LarkFileType;
  staff?: StaffOption[];
  variant?: "link" | "button";
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(
    transferLarkDocumentOwner.bind(null, documentId, fileType),
    initialState,
  );
  useToastOnActionState(state, state.done ? "Đã chuyển quyền sở hữu." : null);

  // `variant` used to switch between a pill button and bare accent text; both
  // are real buttons now, so it only picks the emphasis level.
  const triggerVariant = variant === "button" ? "secondary" : "ghost";

  if (state.done)
    return <span className="text-xs text-ink-2">Đã chuyển quyền sở hữu.</span>;

  const form = (
    <form
      action={formAction}
      className={`flex flex-col gap-2.5 p-3 ${cardClasses}`}
    >
      {/* Warning stays: after transfer the app loses Xoá/Di chuyển on this file. */}
      <p className="text-xs text-ink-2">
        Sau khi chuyển, người này là chủ sở hữu thật trên Lark và web này mất
        quyền xoá/di chuyển file.
      </p>
      <PeoplePicker
        staff={staff}
        value={email}
        onChange={setEmail}
        name="email"
        placeholder="Nhập tên hoặc email@2sgroup.vn"
        inputClassName={inputClasses}
      />
      {state.error && (
        <p className="text-xs font-medium text-red-600">{state.error}</p>
      )}
      <Btn
        type="submit"
        variant="primary"
        size="sm"
        disabled={pending || !email.trim()}
        className="w-fit"
      >
        {pending ? "Đang chuyển..." : "Chuyển quyền"}
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
        {open ? "Đóng" : "Chuyển owner"}
      </Btn>
      {open && form}
    </div>
  );
}
