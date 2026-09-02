"use client";

import { useActionState, useState } from "react";
import { moveLarkDocument, type MoveLarkDocState } from "./actions";
import { Combobox } from "../Combobox";
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
  const [state, formAction, pending] = useActionState(moveLarkDocument.bind(null, documentId, fileType), initialState);
  useToastOnActionState(state, state.done ? "Đã di chuyển file." : null);

  const triggerClassName =
    variant === "button"
      ? "w-fit cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-accent hover:text-accent"
      : "w-fit cursor-pointer text-xs font-medium text-accent hover:text-ink";

  if (state.done) return <span className="text-xs text-ink-2">Đã di chuyển.</span>;

  const form = (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-xl border border-line bg-paper p-3">
      <Combobox
        name="targetFolder"
        value={targetFolder}
        options={folderOptions}
        onChange={setTargetFolder}
        buttonClassName="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5 text-left text-[13.5px] text-ink outline-none"
      />
      {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending || !targetFolder}
        className="w-fit cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang di chuyển..." : "Di chuyển"}
      </button>
    </form>
  );

  if (embedded) return form;

  return (
    <div className="flex flex-col gap-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className={triggerClassName}>
        {open ? "Đóng" : variant === "button" ? "Di chuyển" : "Di chuyển →"}
      </button>
      {open && form}
    </div>
  );
}
