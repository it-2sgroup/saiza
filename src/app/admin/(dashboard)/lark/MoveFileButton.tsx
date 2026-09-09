"use client";

import { useActionState, useState } from "react";
import { moveLarkDocument, type MoveLarkDocState } from "./actions";
import { Combobox } from "../Combobox";
import { Btn, inputClasses, cardClasses } from "../controls";
import type { LarkFileType } from "@/lib/lark/client";
import { useToastOnActionState } from "../useToastOnActionState";

const initialState: MoveLarkDocState = { error: null };

export function MoveFileButton({
  documentId,
  fileType = "docx",
  folderOptions,
  variant = "link",
  embedded = false,
}: {
  documentId: string;
  fileType?: LarkFileType;
  folderOptions: { value: string; label: string }[];
  variant?: "link" | "button";
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [targetFolder, setTargetFolder] = useState("");
  const [state, formAction, pending] = useActionState(
    moveLarkDocument.bind(null, documentId, fileType),
    initialState,
  );
  useToastOnActionState(state, state.done ? "Đã di chuyển file." : null);

  // `variant` used to switch between a pill button and bare accent text; both
  // are real buttons now, so it only picks the emphasis level.
  const triggerVariant = variant === "button" ? "secondary" : "ghost";

  if (state.done)
    return <span className="text-xs text-ink-2">Đã di chuyển.</span>;

  const form = (
    <form
      action={formAction}
      className={`flex flex-col gap-2.5 p-3 ${cardClasses}`}
    >
      <Combobox
        name="targetFolder"
        value={targetFolder}
        options={folderOptions}
        onChange={setTargetFolder}
        buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
      />
      {state.error && (
        <p className="text-xs font-medium text-red-600">{state.error}</p>
      )}
      <Btn
        type="submit"
        variant="primary"
        size="sm"
        disabled={pending || !targetFolder}
        className="w-fit"
      >
        {pending ? "Đang di chuyển..." : "Di chuyển"}
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
        {open ? "Đóng" : "Di chuyển"}
      </Btn>
      {open && form}
    </div>
  );
}
